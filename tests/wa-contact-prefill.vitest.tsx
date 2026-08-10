/**
 * Task #199 — the admin Tools tab WA contact form must pre-fill its inputs
 * from GET /api/config/contact on mount.
 *
 * Exercises the REAL production chain: useContactNumbers() (react-query fetch
 * of /api/config/contact) → useWaContactForm() (pre-fill effect from
 * admin.tsx) → the inputs with data-testid="input-wa-primary" /
 * "input-wa-secondary". Fetch is mocked so the endpoint returns known
 * DB-backed values distinct from the static build-time fallbacks; the test
 * asserts the inputs end up holding the mocked values (not empty strings,
 * not the fallbacks).
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  useContactNumbers,
  WA_CONTACT_NUMBER,
  WA_CONTACT_NUMBER_2,
} from "../client/src/lib/contact";
import { useWaContactForm } from "../client/src/pages/admin";
import { getQueryFn } from "../client/src/lib/queryClient";

// DB-backed values returned by the mocked endpoint — deliberately different
// from the static fallbacks so a regression to fallback/blank is detectable.
const DB_PRIMARY = "6281100000123";
const DB_SECONDARY = "6282200000456";

// ── Probe: mirrors the admin Tools tab wiring exactly ────────────────────────
function WaContactFormProbe() {
  const contact = useContactNumbers();
  const { form, setField } = useWaContactForm(contact);
  return (
    <div>
      <input
        data-testid="input-wa-primary"
        value={form.primary}
        onChange={(e) => setField("primary", e.target.value)}
      />
      <input
        data-testid="input-wa-secondary"
        value={form.secondary}
        onChange={(e) => setField("secondary", e.target.value)}
      />
    </div>
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WA contact form pre-fill from /api/config/contact (Task #199)", () => {
  it("pre-fills both inputs with the DB values after the query resolves", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ primary: DB_PRIMARY, secondary: DB_SECONDARY }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <WaContactFormProbe />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("input-wa-primary")).toHaveValue(DB_PRIMARY);
      expect(screen.getByTestId("input-wa-secondary")).toHaveValue(DB_SECONDARY);
    });

    // Sanity: the DB values (not the build-time fallbacks) won, and the
    // contact endpoint was actually hit.
    expect(DB_PRIMARY).not.toBe(WA_CONTACT_NUMBER);
    expect(DB_SECONDARY).not.toBe(WA_CONTACT_NUMBER_2);
    const urls = fetchSpy.mock.calls.map(([u]) => String(u));
    expect(urls.some((u) => u.includes("/api/config/contact"))).toBe(true);
  });

  it("never renders empty inputs — fallbacks fill the form while loading", async () => {
    // Endpoint that never resolves: simulates the pre-resolution window.
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <WaContactFormProbe />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("input-wa-primary")).toHaveValue(WA_CONTACT_NUMBER);
      expect(screen.getByTestId("input-wa-secondary")).toHaveValue(WA_CONTACT_NUMBER_2);
    });
    expect(screen.getByTestId("input-wa-primary")).not.toHaveValue("");
  });
});
