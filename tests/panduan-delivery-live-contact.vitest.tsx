/**
 * Task #195 — Panduan Delivery instructions update live when the admin
 * rotates the WA number.
 *
 * Renders PanduanDeliveryPage with a mocked GET /api/config/contact response
 * containing DIFFERENT numbers than the static build-time fallbacks, then:
 *  1. Expands the "Paket Berlangganan" (pricing) card and asserts the
 *     "Customer konfirmasi & bayar via WA" step detail shows BOTH mocked
 *     display numbers — and NOT the static fallback displays.
 *  2. Expands the "Paket Bisnis AI" (platform) card and asserts the
 *     "Hubungi via WhatsApp" step detail shows the mocked secondary
 *     display number — and NOT the static fallback.
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock heavy/unrelated pieces ──────────────────────────────────────────────
vi.mock("@/components/shared-header", () => ({
  SharedHeader: () => <header data-testid="mock-shared-header" />,
}));
vi.mock("@/lib/meta-pixel", () => ({
  trackLead: vi.fn(),
}));

import PanduanDeliveryPage from "../client/src/pages/panduan-delivery";
import { getQueryFn } from "../client/src/lib/queryClient";
import {
  WA_CONTACT_DISPLAY,
  WA_CONTACT_DISPLAY_2,
} from "../client/src/lib/contact";

// ── Mocked rotated numbers (distinct from static fallbacks) ─────────────────
const ROTATED = { primary: "6285512345678", secondary: "6285598765432" };
const ROTATED_DISPLAY = "085512345678";
const ROTATED_DISPLAY_2 = "085598765432";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url ?? String(input);
    if (url.includes("/api/config/contact")) return jsonResponse(ROTATED);
    return jsonResponse({});
  });
}

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  render(
    <QueryClientProvider client={qc}>
      <PanduanDeliveryPage />
    </QueryClientProvider>,
  );
  return qc;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Panduan Delivery live WA number (Task #195)", () => {
  it("pricing flow's 'Customer konfirmasi & bayar via WA' step shows the rotated numbers, not the static fallback", async () => {
    mockFetch();
    const qc = renderPage();

    await waitFor(() => {
      expect(qc.getQueryState(["/api/config/contact"])?.status).toBe("success");
    });

    fireEvent.click(screen.getByTestId("button-expand-pricing"));

    const stepLabel = await screen.findByText("Customer konfirmasi & bayar via WA");
    // Step detail is the sibling paragraph within the same StepItem block.
    const stepBlock = stepLabel.closest("div.flex.gap-3") as HTMLElement;
    expect(stepBlock).toBeTruthy();
    const detail = stepBlock.textContent ?? "";

    expect(detail).toContain(ROTATED_DISPLAY);
    expect(detail).toContain(ROTATED_DISPLAY_2);
    expect(detail).not.toContain(WA_CONTACT_DISPLAY);
    expect(detail).not.toContain(WA_CONTACT_DISPLAY_2);
  });

  it("Paket Bisnis AI's 'Hubungi via WhatsApp' step shows the rotated secondary display number", async () => {
    mockFetch();
    const qc = renderPage();

    await waitFor(() => {
      expect(qc.getQueryState(["/api/config/contact"])?.status).toBe("success");
    });

    fireEvent.click(screen.getByTestId("button-expand-platform"));

    const stepLabel = await screen.findByText(/Customer hubungi via WA/);
    const stepBlock = stepLabel.closest("div.flex.gap-3") as HTMLElement;
    expect(stepBlock).toBeTruthy();
    const detail = stepBlock.textContent ?? "";

    expect(detail).toContain("Hubungi via WhatsApp");
    expect(detail).toContain(ROTATED_DISPLAY_2);
    expect(detail).not.toContain(WA_CONTACT_DISPLAY_2);
  });
});
