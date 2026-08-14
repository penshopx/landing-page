/**
 * Task #251 — component-level test: bulk-activate / bulk-reactivate /
 * bulk-deactivate toasts must show the correct "skipped" count.
 *
 * Strategy: render the REAL AdminAcademyPage from admin-academy.tsx with
 * apiRequest mocked. Select real course checkboxes, click the real bulk
 * buttons in the toolbar, and assert the toast title text computed by the
 * production onSuccess handlers ("already = selected - changed").
 *
 * Contracts verified:
 * 1. bulk-reactivate with { reactivated: 1, selected: 3 } →
 *    toast "✅ 1 kursus diaktifkan kembali (2 sudah aktif sebelumnya)"
 * 2. bulk-activate with { activated: 1, selected: 3 } →
 *    toast "✅ 1 kursus diaktifkan (2 sudah aktif sebelumnya)"
 * 3. bulk-deactivate with { deactivated: 2, selected: 4 } →
 *    toast "✅ 2 kursus dinonaktifkan (2 sudah tidak aktif sebelumnya)"
 * 4. No "sudah ... sebelumnya" note when nothing was skipped
 *    (reactivated === selected).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Toast mock: capture toast calls from the real page ───────────────────────
const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

// ── Auth mock: admin user, not loading ────────────────────────────────────────
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "admin-1", role: "admin" },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// ── Heavy layout stub ─────────────────────────────────────────────────────────
vi.mock("@/components/shared-header", () => ({
  SharedHeader: () => <div data-testid="stub-shared-header" />,
}));

// ── apiRequest mock + fresh QueryClient (page imports both) ──────────────────
const { apiRequestMock } = vi.hoisted(() => {
  return { apiRequestMock: vi.fn() };
});

vi.mock("@/lib/queryClient", async () => {
  const { QueryClient } = await import("@tanstack/react-query");
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  (globalThis as any).__testQueryClient = qc;
  return {
    apiRequest: apiRequestMock,
    queryClient: qc,
    getQueryFn: () => async () => null,
  };
});

// Real production page (must be imported AFTER the mocks above)
import AdminAcademyPage from "../client/src/pages/admin-academy";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCourse(id: number, isActive: boolean) {
  return {
    id,
    title: `Kursus ${id}`,
    slug: `kursus-${id}`,
    shortDesc: "",
    description: "",
    category: "onboarding",
    subcategory: "",
    color: "#6366f1",
    emoji: "📚",
    instructor: "Tim Gustafta",
    durationMinutes: 10,
    price: 0,
    level: "beginner",
    isFeatured: false,
    isPublic: true,
    isActive,
    sortOrder: id,
    lessonCount: 0,
    createdAt: new Date("2026-01-01").toISOString(),
  };
}

const HEALTH = {
  seedStatus: "done",
  seeding: false,
  counts: {
    totalCourses: 4,
    activeCourses: 2,
    totalLessons: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
    pendingCertificates: 0,
  },
  lastBackfill: null,
};

const COURSES = [makeCourse(1, false), makeCourse(2, true), makeCourse(3, true), makeCourse(4, true)];

/** Configure apiRequest routing; bulk endpoints resolve with `bulkResponse`. */
function wireApi(bulkResponse: Record<string, any>) {
  apiRequestMock.mockImplementation(async (_method: string, url: string) => {
    if (url === "/api/admin/lms/courses") return COURSES;
    if (url === "/api/admin/lms/health") return HEALTH;
    if (url.includes("/bulk-")) return bulkResponse;
    return {};
  });
}

async function renderPageAndSelect(courseIds: number[]) {
  const qc: QueryClient = (globalThis as any).__testQueryClient;
  qc.clear();
  // Pre-seed the cache so the page renders with data on the very first pass —
  // avoids the loading-phase effect churn in happy-dom.
  qc.setQueryData(["/api/admin/lms/courses"], COURSES);
  qc.setQueryData(["/api/admin/lms/health"], HEALTH);
  render(
    <QueryClientProvider client={qc}>
      <AdminAcademyPage />
    </QueryClientProvider>
  );

  // Wait for the real courses list to render, then tick the real checkboxes.
  for (const id of courseIds) {
    const checkbox = await screen.findByTestId(`checkbox-course-${id}`);
    fireEvent.click(checkbox);
  }
  // Bulk toolbar appears only when a selection exists.
  await screen.findByTestId("button-bulk-reactivate");
}

function lastToastTitle(): string {
  expect(toastSpy).toHaveBeenCalled();
  const call = toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0];
  return String(call.title ?? "");
}

beforeEach(() => {
  toastSpy.mockReset();
  apiRequestMock.mockReset();
});

afterEach(() => {
  cleanup();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AdminAcademyPage bulk toolbar toasts — skipped count", () => {
  it("bulk-reactivate: { reactivated: 1, selected: 3 } → toast includes '2 sudah aktif sebelumnya'", async () => {
    wireApi({ ok: true, reactivated: 1, selected: 3 });
    await renderPageAndSelect([1, 2, 3]);

    fireEvent.click(screen.getByTestId("button-bulk-reactivate"));

    await waitFor(() => {
      expect(lastToastTitle()).toContain("2 sudah aktif sebelumnya");
    });
    expect(lastToastTitle()).toContain("1 kursus diaktifkan kembali");

    // The real mutation must have hit the PATCH bulk-reactivate endpoint.
    expect(apiRequestMock).toHaveBeenCalledWith(
      "PATCH",
      "/api/admin/lms/courses/bulk-reactivate",
      { ids: expect.arrayContaining([1, 2, 3]) }
    );
  });

  it("bulk-activate: { activated: 1, selected: 3 } → toast includes '2 sudah aktif sebelumnya'", async () => {
    wireApi({ ok: true, activated: 1, selected: 3 });
    await renderPageAndSelect([1, 2, 3]);

    fireEvent.click(screen.getByTestId("button-bulk-activate"));

    await waitFor(() => {
      expect(lastToastTitle()).toContain("2 sudah aktif sebelumnya");
    });
    expect(lastToastTitle()).toContain("1 kursus diaktifkan");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "POST",
      "/api/admin/lms/courses/bulk-activate",
      { ids: expect.arrayContaining([1, 2, 3]) }
    );
  });

  it("bulk-deactivate: { deactivated: 2, selected: 4 } → toast includes '2 sudah tidak aktif sebelumnya'", async () => {
    wireApi({ ok: true, deactivated: 2, selected: 4 });
    await renderPageAndSelect([1, 2, 3, 4]);

    fireEvent.click(screen.getByTestId("button-bulk-deactivate"));

    await waitFor(() => {
      expect(lastToastTitle()).toContain("2 sudah tidak aktif sebelumnya");
    });
    expect(lastToastTitle()).toContain("2 kursus dinonaktifkan");

    expect(apiRequestMock).toHaveBeenCalledWith(
      "POST",
      "/api/admin/lms/courses/bulk-deactivate",
      { ids: expect.arrayContaining([1, 2, 3, 4]) }
    );
  });

  it("bulk-reactivate with nothing skipped (reactivated === selected) → no 'sebelumnya' note", async () => {
    wireApi({ ok: true, reactivated: 2, selected: 2 });
    await renderPageAndSelect([1, 2]);

    fireEvent.click(screen.getByTestId("button-bulk-reactivate"));

    await waitFor(() => {
      expect(lastToastTitle()).toContain("2 kursus diaktifkan kembali");
    });
    expect(lastToastTitle()).not.toContain("sebelumnya");
  });
});
