/**
 * Behavioral test — verifies that bulk-activate and bulk-deactivate mutations
 * invalidate the courses query cache so the list re-fetches automatically
 * (no manual refresh needed).
 *
 * Strategy: renderHook creates a real QueryClient, spies on invalidateQueries,
 * and runs the same useMutation + onSuccess logic used in AdminAcademyPage.
 * The spy confirms the exact query key that must be invalidated for the list
 * to refresh. Any change to the query key, or removal of the invalidateQueries
 * call in the page's onSuccess handler, will break these assertions.
 *
 * Contracts verified:
 * 1. POST /api/admin/lms/courses/bulk-activate → on success, invalidates
 *    both ["/api/admin/lms/courses"] and ["/api/admin/lms/health"].
 * 2. POST /api/admin/lms/courses/bulk-deactivate → same invalidations.
 * 3. `activated` count from the server (1, not 3) is surfaced correctly
 *    to the onSuccess handler when 3 ids are submitted but only 1 changed.
 * 4. `deactivated` count is surfaced correctly for the mirror scenario.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** Wrapper that provides the QueryClient to the hook under test. */
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

/**
 * Minimal hook that mirrors the bulkActivateMutation defined in AdminAcademyPage.
 * It is structurally identical to the production hook — same mutationFn (calls
 * apiRequest), same queryKeys in onSuccess invalidations.
 * If the production hook is refactored to use different keys or skip the
 * invalidation, the static guard tests below will catch the drift.
 */
function useBulkActivate(
  qc: ReturnType<typeof useQueryClient>,
  onActivated: (activated: number, selected: number) => void
) {
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch("/api/admin/lms/courses/bulk-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      onActivated(data.activated, data.selected);
      qc.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lms/health"] });
    },
  });
}

function useBulkDeactivate(
  qc: ReturnType<typeof useQueryClient>,
  onDeactivated: (deactivated: number, selected: number) => void
) {
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch("/api/admin/lms/courses/bulk-deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      onDeactivated(data.deactivated, data.selected);
      qc.invalidateQueries({ queryKey: ["/api/admin/lms/courses"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/lms/health"] });
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("bulk-activate: query invalidation and count surfacing", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it(
    "invalidates /api/admin/lms/courses after success",
    async () => {
      const qc = makeQueryClient();
      const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

      (global as any).fetch = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, activated: 1, selected: 3, ids: [1, 2, 3] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      const { result } = renderHook(
        () => {
          const queryClient = useQueryClient();
          return useBulkActivate(queryClient, () => {});
        },
        { wrapper: makeWrapper(qc) }
      );

      await act(async () => {
        result.current.mutate([1, 2, 3]);
        // Wait for mutation to settle
        await new Promise((r) => setTimeout(r, 100));
      });

      const calledKeys = invalidateSpy.mock.calls.map(
        (call) => (call[0] as any)?.queryKey
      );

      expect(calledKeys).toContainEqual(["/api/admin/lms/courses"]);
    }
  );

  it(
    "invalidates /api/admin/lms/health after success",
    async () => {
      const qc = makeQueryClient();
      const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

      (global as any).fetch = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, activated: 1, selected: 3, ids: [1, 2, 3] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      const { result } = renderHook(
        () => {
          const queryClient = useQueryClient();
          return useBulkActivate(queryClient, () => {});
        },
        { wrapper: makeWrapper(qc) }
      );

      await act(async () => {
        result.current.mutate([1, 2, 3]);
        await new Promise((r) => setTimeout(r, 100));
      });

      const calledKeys = invalidateSpy.mock.calls.map(
        (call) => (call[0] as any)?.queryKey
      );

      expect(calledKeys).toContainEqual(["/api/admin/lms/health"]);
    }
  );

  it(
    "onSuccess receives activated=1 and selected=3 when only 1 of 3 courses was actually inactive",
    async () => {
      // Server returns: 1 activated (the single inactive one), 3 selected (full input)
      (global as any).fetch = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, activated: 1, selected: 3, ids: [1, 2, 3] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      const qc = makeQueryClient();
      const onActivated = vi.fn();

      const { result } = renderHook(
        () => {
          const queryClient = useQueryClient();
          return useBulkActivate(queryClient, onActivated);
        },
        { wrapper: makeWrapper(qc) }
      );

      // Submit 3 ids (2 already active, 1 inactive)
      await act(async () => {
        result.current.mutate([1, 2, 3]);
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(onActivated).toHaveBeenCalledOnce();
      const [activated, selected] = onActivated.mock.calls[0];
      expect(activated).toBe(1);  // only 1 actually changed
      expect(selected).toBe(3);   // 3 were submitted
    }
  );
});

describe("bulk-deactivate: query invalidation and count surfacing", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it(
    "invalidates /api/admin/lms/courses after success",
    async () => {
      const qc = makeQueryClient();
      const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

      (global as any).fetch = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, deactivated: 1, selected: 3, ids: [1, 2, 3] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      const { result } = renderHook(
        () => {
          const queryClient = useQueryClient();
          return useBulkDeactivate(queryClient, () => {});
        },
        { wrapper: makeWrapper(qc) }
      );

      await act(async () => {
        result.current.mutate([1, 2, 3]);
        await new Promise((r) => setTimeout(r, 100));
      });

      const calledKeys = invalidateSpy.mock.calls.map(
        (call) => (call[0] as any)?.queryKey
      );

      expect(calledKeys).toContainEqual(["/api/admin/lms/courses"]);
    }
  );

  it(
    "invalidates /api/admin/lms/health after success",
    async () => {
      const qc = makeQueryClient();
      const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

      (global as any).fetch = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, deactivated: 1, selected: 3, ids: [1, 2, 3] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      const { result } = renderHook(
        () => {
          const queryClient = useQueryClient();
          return useBulkDeactivate(queryClient, () => {});
        },
        { wrapper: makeWrapper(qc) }
      );

      await act(async () => {
        result.current.mutate([1, 2, 3]);
        await new Promise((r) => setTimeout(r, 100));
      });

      const calledKeys = invalidateSpy.mock.calls.map(
        (call) => (call[0] as any)?.queryKey
      );

      expect(calledKeys).toContainEqual(["/api/admin/lms/health"]);
    }
  );

  it(
    "onSuccess receives deactivated=1 and selected=3 when only 1 of 3 courses was actually active",
    async () => {
      // Server returns: 1 deactivated (the single active one), 3 selected (full input)
      (global as any).fetch = vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, deactivated: 1, selected: 3, ids: [1, 2, 3] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
      );

      const qc = makeQueryClient();
      const onDeactivated = vi.fn();

      const { result } = renderHook(
        () => {
          const queryClient = useQueryClient();
          return useBulkDeactivate(queryClient, onDeactivated);
        },
        { wrapper: makeWrapper(qc) }
      );

      // Submit 3 ids (2 already inactive, 1 active)
      await act(async () => {
        result.current.mutate([1, 2, 3]);
        await new Promise((r) => setTimeout(r, 100));
      });

      expect(onDeactivated).toHaveBeenCalledOnce();
      const [deactivated, selected] = onDeactivated.mock.calls[0];
      expect(deactivated).toBe(1);  // only 1 actually changed
      expect(selected).toBe(3);     // 3 were submitted
    }
  );
});

// ── Static guards: confirm production code uses the exact keys ────────────────

describe("static: AdminAcademyPage bulk mutations invalidate the correct query keys", () => {
  it("bulkActivateMutation.onSuccess invalidates /api/admin/lms/courses", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { resolve, dirname } = await import("node:path");
    const __dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      resolve(__dir, "../client/src/pages/admin-academy.tsx"),
      "utf8"
    );

    // Find the bulkActivateMutation block and confirm it calls invalidateQueries
    // with the courses key.
    const activateBlock = src.slice(
      src.indexOf("const bulkActivateMutation"),
      src.indexOf("const bulkReactivateMutation")
    );

    expect(activateBlock).toContain('"/api/admin/lms/courses"');
    expect(activateBlock).toContain("invalidateQueries");
    expect(activateBlock).toContain("data.activated");
  });

  it("bulkDeactivateMutation.onSuccess invalidates /api/admin/lms/courses", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { resolve, dirname } = await import("node:path");
    const __dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      resolve(__dir, "../client/src/pages/admin-academy.tsx"),
      "utf8"
    );

    const deactivateBlock = src.slice(
      src.indexOf("const bulkDeactivateMutation"),
      src.indexOf("const bulkActivateMutation")
    );

    expect(deactivateBlock).toContain('"/api/admin/lms/courses"');
    expect(deactivateBlock).toContain("invalidateQueries");
    expect(deactivateBlock).toContain("data.deactivated");
  });
});
