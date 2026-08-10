/**
 * Task #194 — useContactNumbers() falls back to static values when
 * GET /api/config/contact is unreachable, then recovers to live values.
 *
 * Fetch is intercepted with vi.spyOn so the endpoint can be forced to fail
 * (network error) and later succeed. A tiny probe component renders the
 * wa.me link so we can assert on the actual anchor href.
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
import { getQueryFn } from "../client/src/lib/queryClient";

// ── Probe component: renders exactly what a WA CTA would render ──────────────
function WaCtaProbe() {
  const contact = useContactNumbers();
  return (
    <div>
      <a data-testid="wa-link-primary" href={contact.link}>
        Chat WA
      </a>
      <a data-testid="wa-link-secondary" href={contact.link2}>
        Chat WA 2
      </a>
      <a data-testid="wa-link-with-text" href={contact.waLink("Halo")}>
        Chat WA (pesan)
      </a>
      <span data-testid="wa-display">{contact.display}</span>
    </div>
  );
}

function makeQueryClient() {
  // Same queryFn wiring as the app's real queryClient, but without retry
  // backoff so error state resolves immediately in the test.
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
      },
    },
  });
}

function renderProbe(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <WaCtaProbe />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useContactNumbers() fallback (Task #194)", () => {
  it("renders static fallback wa.me links when the contact API is unreachable", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new TypeError("Failed to fetch"));

    const qc = makeQueryClient();
    renderProbe(qc);

    // Wait until the query has actually failed (so we assert post-error state,
    // not just the initial loading render).
    await waitFor(() => {
      expect(qc.getQueryState(["/api/config/contact"])?.status).toBe("error");
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(screen.getByTestId("wa-link-primary")).toHaveAttribute(
      "href",
      `https://wa.me/${WA_CONTACT_NUMBER}`,
    );
    expect(screen.getByTestId("wa-link-secondary")).toHaveAttribute(
      "href",
      `https://wa.me/${WA_CONTACT_NUMBER_2}`,
    );
    expect(screen.getByTestId("wa-link-with-text")).toHaveAttribute(
      "href",
      `https://wa.me/${WA_CONTACT_NUMBER}?text=${encodeURIComponent("Halo")}`,
    );
    // Fallback numbers are never empty → CTA never breaks.
    expect(WA_CONTACT_NUMBER).toMatch(/^\d{8,}$/);
    expect(screen.getByTestId("wa-display").textContent).toMatch(/^0\d+/);
  });

  it("shows the live number after the API recovers", async () => {
    const LIVE = { primary: "6289900112233", secondary: "6288877665544" };

    // Phase 1: API down.
    let apiUp = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      if (!apiUp) throw new TypeError("Failed to fetch");
      return new Response(JSON.stringify(LIVE), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const qc = makeQueryClient();
    renderProbe(qc);

    await waitFor(() => {
      expect(qc.getQueryState(["/api/config/contact"])?.status).toBe("error");
    });
    // Still on fallback.
    expect(screen.getByTestId("wa-link-primary")).toHaveAttribute(
      "href",
      `https://wa.me/${WA_CONTACT_NUMBER}`,
    );

    // Phase 2: API recovers; a refetch (as react-query would do on
    // reconnect/interval/invalidations) brings in the live number.
    apiUp = true;
    await qc.refetchQueries({ queryKey: ["/api/config/contact"] });

    await waitFor(() => {
      expect(screen.getByTestId("wa-link-primary")).toHaveAttribute(
        "href",
        `https://wa.me/${LIVE.primary}`,
      );
    });
    expect(screen.getByTestId("wa-link-secondary")).toHaveAttribute(
      "href",
      `https://wa.me/${LIVE.secondary}`,
    );
    expect(screen.getByTestId("wa-display").textContent).toBe(
      LIVE.primary.replace(/^62/, "0"),
    );
  });
});
