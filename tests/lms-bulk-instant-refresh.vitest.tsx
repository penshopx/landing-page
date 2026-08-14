/**
 * Task — Confirm the course list updates instantly after bulk-activate /
 * bulk-deactivate without a manual refresh.
 *
 * Strategy: mount the REAL AdminAcademyPage (client/src/pages/admin-academy.tsx)
 * with the app's real global queryClient (the page's mutations invalidate that
 * exact instance, so the provider must use it too). The query cache is
 * pre-seeded with fixtures before render (loading-phase livelock guard), and
 * global fetch is mocked as a tiny stateful "server":
 *   - GET  /api/admin/lms/courses      → current server course state
 *   - POST /api/admin/lms/courses/bulk-activate   → flips isActive=true
 *   - POST /api/admin/lms/courses/bulk-deactivate → flips isActive=false
 *
 * After clicking "Aktifkan semua" the ONLY way the UI can show the updated
 * badges is if the mutation's invalidateQueries triggers an automatic refetch
 * of the courses query — exactly the regression this test guards.
 *
 * Contracts verified:
 * 1. Mixed list renders "nonaktif" badges for inactive courses.
 * 2. Select all + "Aktifkan semua" → badges disappear without any manual
 *    refresh, and a refetch of /api/admin/lms/courses actually happened.
 * 3. Mirror: select all + "Nonaktifkan semua" → every course shows "nonaktif".
 * 4. Selection is cleared after a bulk action (toolbar disappears).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";

// The page's mutations call invalidateQueries on this exact instance —
// the provider must therefore use the same one.
import { queryClient } from "@/lib/queryClient";
import AdminAcademyPage from "../client/src/pages/admin-academy";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_USER = {
  id: "admin-1",
  email: "admin@gustafta.test",
  role: "admin",
  isActive: true,
};

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
    durationMinutes: 30,
    price: 0,
    level: "beginner",
    isFeatured: false,
    isPublic: true,
    isActive,
    sortOrder: id,
    lessonCount: 0,
    createdAt: new Date(2026, 0, 1).toISOString(),
  };
}

const HEALTH = {
  seedStatus: "done",
  seeding: false,
  counts: {
    totalCourses: 3,
    activeCourses: 1,
    totalLessons: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
    pendingCertificates: 0,
  },
  lastBackfill: null,
};

// ── Stateful fetch mock (mini server) ─────────────────────────────────────────

let serverCourses: ReturnType<typeof makeCourse>[];
let coursesRefetchCount: number;
let originalFetch: typeof global.fetch;

function json(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function installFetchMock() {
  originalFetch = global.fetch;
  (global as any).fetch = vi.fn((input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/api/auth/user")) return json(ADMIN_USER);

    if (url.includes("/api/admin/lms/courses/bulk-activate") && method === "POST") {
      const { ids } = JSON.parse(init.body);
      let activated = 0;
      serverCourses = serverCourses.map((c) => {
        if (ids.includes(c.id) && !c.isActive) {
          activated++;
          return { ...c, isActive: true };
        }
        return c;
      });
      return json({ ok: true, activated, selected: ids.length, ids });
    }

    if (url.includes("/api/admin/lms/courses/bulk-deactivate") && method === "POST") {
      const { ids } = JSON.parse(init.body);
      let deactivated = 0;
      serverCourses = serverCourses.map((c) => {
        if (ids.includes(c.id) && c.isActive) {
          deactivated++;
          return { ...c, isActive: false };
        }
        return c;
      });
      return json({ ok: true, deactivated, selected: ids.length, ids });
    }

    if (url.includes("/api/admin/lms/health")) return json(HEALTH);

    if (url.includes("/api/admin/lms/courses") && method === "GET") {
      coursesRefetchCount++;
      return json(serverCourses);
    }

    // Any other endpoint the page happens to touch — benign empty response
    return json({});
  });
}

// ── Harness ───────────────────────────────────────────────────────────────────

function renderPage() {
  // Pre-seed every query the page mounts BEFORE render (livelock guard:
  // never let the page sit in its loading phase with default [] data).
  queryClient.setQueryData(["/api/auth/user"], ADMIN_USER);
  queryClient.setQueryData(["/api/admin/lms/courses"], serverCourses);
  queryClient.setQueryData(["/api/admin/lms/health"], HEALTH);

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminAcademyPage />
    </QueryClientProvider>
  );
}

function selectAllCourses() {
  for (const c of serverCourses) {
    const box = screen.getByTestId(`checkbox-course-${c.id}`) as HTMLInputElement;
    if (!box.checked) fireEvent.click(box);
  }
}

const nonaktifBadges = () => screen.queryAllByText("nonaktif");

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Admin Academy — course list refreshes instantly after bulk actions", () => {
  beforeEach(() => {
    // Mixed state: course 1 active, courses 2 & 3 inactive
    serverCourses = [makeCourse(1, true), makeCourse(2, false), makeCourse(3, false)];
    coursesRefetchCount = 0;
    installFetchMock();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    queryClient.getMutationCache().clear();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders the mixed list with 'nonaktif' badges only on inactive courses", () => {
    renderPage();

    expect(screen.getByText("Kursus 1")).toBeInTheDocument();
    expect(screen.getByText("Kursus 2")).toBeInTheDocument();
    expect(screen.getByText("Kursus 3")).toBeInTheDocument();
    // 2 of 3 courses are inactive
    expect(nonaktifBadges()).toHaveLength(2);
  });

  it("select all + 'Aktifkan semua' → all badges disappear WITHOUT manual refresh", async () => {
    renderPage();
    expect(nonaktifBadges()).toHaveLength(2);

    selectAllCourses();
    expect(screen.getByText("3 kursus dipilih")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-bulk-activate"));

    // The list must re-render as fully active with no user action —
    // driven solely by invalidateQueries → automatic refetch.
    await waitFor(() => {
      expect(nonaktifBadges()).toHaveLength(0);
    });

    // Prove the refresh came from a real automatic refetch of the courses query
    expect(coursesRefetchCount).toBeGreaterThan(0);

    // All three courses still visible (list refreshed, not emptied)
    expect(screen.getByText("Kursus 1")).toBeInTheDocument();
    expect(screen.getByText("Kursus 2")).toBeInTheDocument();
    expect(screen.getByText("Kursus 3")).toBeInTheDocument();
  });

  it("select all + 'Nonaktifkan semua' → every course shows 'nonaktif' instantly", async () => {
    renderPage();
    expect(nonaktifBadges()).toHaveLength(2);

    selectAllCourses();
    fireEvent.click(screen.getByTestId("button-bulk-deactivate"));

    await waitFor(() => {
      expect(nonaktifBadges()).toHaveLength(3);
    });
    expect(coursesRefetchCount).toBeGreaterThan(0);
  });

  it("selection is cleared after a bulk action — toolbar disappears", async () => {
    renderPage();
    selectAllCourses();
    expect(screen.getByText("3 kursus dipilih")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-bulk-activate"));

    await waitFor(() => {
      expect(screen.queryByText("3 kursus dipilih")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(nonaktifBadges()).toHaveLength(0);
    });
  });
});
