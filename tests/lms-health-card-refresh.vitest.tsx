/**
 * Task #242 — LMS health card counts must update immediately after a course
 * toggle, WITHOUT a manual refresh.
 *
 * The production wiring under test:
 * - admin-academy.tsx mutations (deactivateMut, delMut, CourseDialog mut,
 *   bulkActivateMutation, bulkDeactivateMutation, bulkReactivateMutation)
 *   each call queryClient.invalidateQueries({ queryKey: ["/api/admin/lms/health"] })
 *   in onSuccess.
 * - The health card renders counts from the ["/api/admin/lms/health"] query
 *   (admin.tsx card-lms-health and the admin-academy health strip), with
 *   staleTime 30s and no auto refetch — so WITHOUT the invalidation the card
 *   would keep showing the stale count.
 *
 * Strategy (same pattern as lms-bulk-activate-deactivate-ui.vitest.tsx):
 * 1. Behavioral test — render a HealthCard that uses the production query key
 *    and production-like options (staleTime 30s), plus a toggle mutation that
 *    is structurally identical to deactivateMut (same onSuccess invalidations).
 *    Mocked fetch serves activeCourses=5 before the toggle and 4 after.
 *    Assert the card re-renders "4" after the mutation settles — with NO
 *    manual refetch() call. A negative control proves the same setup does NOT
 *    update when the invalidation is removed (i.e. the test can actually fail).
 * 2. Static guards — parse client/src/pages/admin-academy.tsx and assert every
 *    course-mutation onSuccess still invalidates ["/api/admin/lms/health"],
 *    and that admin.tsx's health card query uses the exact same key. Any
 *    regression that drops an invalidation or renames the key fails here.
 */

import React from "react";
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// ── Harness ───────────────────────────────────────────────────────────────────

const HEALTH_KEY = ["/api/admin/lms/health"];
const COURSES_KEY = ["/api/admin/lms/courses"];

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** Mirrors the health query in admin-academy.tsx / admin.tsx (same key, staleTime 30s). */
function HealthCard() {
  const { data } = useQuery<{ counts: { activeCourses: number; totalCourses: number } }>({
    queryKey: HEALTH_KEY,
    queryFn: async () => {
      const res = await fetch("/api/admin/lms/health");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: false,
  });
  return (
    <div data-testid="card-lms-health">
      <span data-testid="health-active-courses">
        {data ? data.counts.activeCourses : "—"}
      </span>
    </div>
  );
}

/**
 * Mirrors deactivateMut in AdminAcademyPage: PATCH the course, then invalidate
 * courses + health. `invalidateHealth=false` is the negative control.
 */
function ToggleButton({ invalidateHealth }: { invalidateHealth: boolean }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/lms/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COURSES_KEY });
      if (invalidateHealth) qc.invalidateQueries({ queryKey: HEALTH_KEY });
    },
  });
  return (
    <button data-testid="button-toggle-course" onClick={() => mut.mutate(1)}>
      Nonaktifkan
    </button>
  );
}

function Harness({ qc, invalidateHealth = true }: { qc: QueryClient; invalidateHealth?: boolean }) {
  return (
    <QueryClientProvider client={qc}>
      <HealthCard />
      <ToggleButton invalidateHealth={invalidateHealth} />
    </QueryClientProvider>
  );
}

/** fetch mock: health returns `activeCourses` from a mutable box; PATCH decrements it. */
function installFetchMock() {
  const state = { activeCourses: 5, healthCalls: 0 };
  (global as any).fetch = vi.fn(async (url: any, init?: any) => {
    const u = String(url);
    if (u.includes("/api/admin/lms/health")) {
      state.healthCalls++;
      return new Response(
        JSON.stringify({
          seedStatus: "done",
          seeding: false,
          counts: { totalCourses: 6, activeCourses: state.activeCourses, totalLessons: 20, totalEnrollments: 9 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (u.includes("/api/admin/lms/courses/") && init?.method === "PATCH") {
      state.activeCourses -= 1; // toggle off → one fewer active course
      return new Response(JSON.stringify({ ok: true, isActive: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // courses list refetch after invalidation
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  return state;
}

// ── Behavioral tests ──────────────────────────────────────────────────────────

describe("LMS health card refreshes automatically after a course toggle", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("re-renders the updated activeCourses count after the toggle mutation settles — no manual refresh", async () => {
    const state = installFetchMock();
    const qc = makeQueryClient();
    render(<Harness qc={qc} />);

    // Initial load shows 5 active courses
    await waitFor(() =>
      expect(screen.getByTestId("health-active-courses").textContent).toBe("5")
    );
    expect(state.healthCalls).toBe(1);

    // Toggle a course off (mirrors deactivateMut)
    fireEvent.click(screen.getByTestId("button-toggle-course"));

    // Health card must re-fetch and show 4 WITHOUT any manual refetch call,
    // despite staleTime 30s — invalidateQueries forces the active query to refetch.
    await waitFor(() =>
      expect(screen.getByTestId("health-active-courses").textContent).toBe("4")
    );
    expect(state.healthCalls).toBe(2);
    qc.clear();
  });

  it("negative control: WITHOUT the health invalidation the card stays stale at 5", async () => {
    const state = installFetchMock();
    const qc = makeQueryClient();
    render(<Harness qc={qc} invalidateHealth={false} />);

    await waitFor(() =>
      expect(screen.getByTestId("health-active-courses").textContent).toBe("5")
    );

    fireEvent.click(screen.getByTestId("button-toggle-course"));

    // Give the mutation + any (wrong) refetch a chance to happen
    await waitFor(() => expect((global.fetch as any).mock.calls.some(
      (c: any[]) => String(c[0]).includes("/api/admin/lms/courses/1")
    )).toBe(true));
    await new Promise((r) => setTimeout(r, 150));

    // Server now says 4, but the card still shows the stale 5 → proves the
    // invalidation in production onSuccess handlers is what keeps it fresh.
    expect(state.activeCourses).toBe(4);
    expect(screen.getByTestId("health-active-courses").textContent).toBe("5");
    expect(state.healthCalls).toBe(1);
    qc.clear();
  });
});

// ── Static guards on the production source ───────────────────────────────────

describe("static guard: every course mutation in admin-academy.tsx invalidates the health query", () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "../client/src/pages/admin-academy.tsx"),
    "utf8"
  );

  /**
   * Extract the body of a `const <name> = useMutation({ ... })` declaration.
   * `anchor` disambiguates duplicate names (e.g. delMut exists for both
   * lesson-delete and course-delete): the block picked is the first one at or
   * after the anchor string's position.
   */
  function mutationBlock(name: string, anchor?: string): string {
    const from = anchor ? src.indexOf(anchor) : 0;
    expect(from, `anchor "${anchor}" not found`).toBeGreaterThan(-1);
    // The anchor lives INSIDE the target block, so scan backwards from it.
    const start = anchor
      ? src.lastIndexOf(`const ${name} = useMutation(`, from)
      : src.indexOf(`const ${name} = useMutation(`);
    expect(start, `mutation "${name}" not found in admin-academy.tsx`).toBeGreaterThan(-1);
    // Block ends at the closing `});` at the same nesting — approximate by
    // scanning braces from the opening paren.
    let depth = 0;
    let i = src.indexOf("(", start);
    for (; i < src.length; i++) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    return src.slice(start, i + 1);
  }

  const HEALTH_INVALIDATION =
    /invalidateQueries\(\s*\{\s*queryKey:\s*\[\s*["']\/api\/admin\/lms\/health["']\s*\]/;

  const cases: Array<[string, string | undefined]> = [
    ["deactivateMut", undefined],
    // Two delMut declarations exist (lesson delete + course delete); anchor on
    // the course DELETE endpoint to pick the course one.
    ["delMut", "/api/admin/lms/courses/${id}${force"],
    ["bulkActivateMutation", undefined],
    ["bulkDeactivateMutation", undefined],
    ["bulkReactivateMutation", undefined],
  ];
  for (const [name, anchor] of cases) {
    it(`${name} onSuccess invalidates ["/api/admin/lms/health"]`, () => {
      expect(mutationBlock(name, anchor)).toMatch(HEALTH_INVALIDATION);
    });
  }

  it('CourseDialog "mut" (create/edit) invalidates ["/api/admin/lms/health"]', () => {
    // CourseDialog's mutation is named plain `mut`; locate the one whose
    // mutationFn posts to /api/admin/lms/courses.
    const start = src.indexOf('apiRequest("POST", "/api/admin/lms/courses", form)');
    expect(start).toBeGreaterThan(-1);
    const onSuccess = src.indexOf("onSuccess", start);
    const window = src.slice(onSuccess, onSuccess + 500);
    expect(window).toMatch(HEALTH_INVALIDATION);
  });

  it("the health query in admin-academy.tsx and admin.tsx use the same key the mutations invalidate", () => {
    const HEALTH_QUERY_KEY = /queryKey:\s*\[\s*["']\/api\/admin\/lms\/health["']\s*\]/;
    expect(src).toMatch(HEALTH_QUERY_KEY);
    const adminSrc = fs.readFileSync(
      path.resolve(__dirname, "../client/src/pages/admin.tsx"),
      "utf8"
    );
    expect(adminSrc).toMatch(HEALTH_QUERY_KEY);
  });
});
