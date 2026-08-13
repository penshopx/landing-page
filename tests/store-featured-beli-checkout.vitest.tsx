/**
 * Task #234 — Featured-page Beli button opens the correct Scalev checkout URL
 *
 * Component test (Vitest + @testing-library/react + happy-dom) rendering
 * client/src/pages/store-featured.tsx with a mocked /api/store/featured
 * response, then clicking the Beli button and asserting window.open.
 *
 * Yang diverifikasi:
 * 1. scalevVariantId tanpa paymentUrl → window.open dipanggil dengan
 *    `${PAYMENT_BASE_URL}/c/checkout?variant_ids=<id>&qty=1`.
 * 2. paymentUrl DAN scalevVariantId keduanya ada → paymentUrl menang.
 * 3. Tanpa keduanya → fallback WA inquiry (bukan checkout).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock wouter ──────────────────────────────────────────────────────────────
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useLocation: () => ["/store-featured", vi.fn()],
    Link: ({ children, href, ...rest }: any) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

// ── Component under test ─────────────────────────────────────────────────────
import StoreFeatured from "../client/src/pages/store-featured";
import { PAYMENT_BASE_URL } from "../client/src/lib/payment-base";
import { getQueryFn } from "../client/src/lib/queryClient";

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CONTACT_RESPONSE = {
  primary: "6281287941900",
  secondary: "6282299417818",
};

function makeProduct(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "prod-1",
    productId: 1,
    name: "Produk Uji",
    category: "engineering",
    tagline: "Tagline uji",
    description: "Deskripsi",
    productSummary: "Ringkasan",
    productFeatures: ["Fitur A"],
    emoji: "🤖",
    color: "#7c3aed",
    isGustafta: true,
    price: 150000,
    originalPrice: null,
    agentId: null,
    agentCount: 2,
    paymentUrl: null,
    scalevVariantId: null,
    type: "store",
    ...overrides,
  };
}

function buildFetchSpy(product: Record<string, unknown>) {
  return vi.fn((url: string | URL | Request): Promise<Response> => {
    const urlStr =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.href
          : (url as Request).url;

    if (urlStr.includes("/api/store/featured")) {
      return Promise.resolve(jsonResponse({ gustafta: [product], mitra: [] }));
    }
    if (urlStr.includes("/api/config/contact")) {
      return Promise.resolve(jsonResponse(CONTACT_RESPONSE));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ error: "not found" }), { status: 404 })
    );
  });
}

function renderFeatured(product: Record<string, unknown>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "returnNull" }),
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
  (global as any).fetch = buildFetchSpy(product);
  render(
    <QueryClientProvider client={queryClient}>
      <StoreFeatured />
    </QueryClientProvider>
  );
}

async function clickBeli(productId: string) {
  const btn = await waitFor(
    () => {
      const el = screen.getByTestId(`button-buy-featured-${productId}`);
      expect(el).toBeInTheDocument();
      return el;
    },
    { timeout: 5000 }
  );
  fireEvent.click(btn);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("StoreFeatured — Beli button opens correct Scalev checkout URL", () => {
  let originalFetch: typeof global.fetch;
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalFetch = global.fetch;
    openSpy = vi.spyOn(window, "open").mockImplementation(() => null as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("scalevVariantId tanpa paymentUrl → membuka /c/checkout?variant_ids=<id>&qty=1", async () => {
    renderFeatured(makeProduct({ scalevVariantId: 98765, paymentUrl: null }));
    await clickBeli("prod-1");

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = String(openSpy.mock.calls[0][0]);
    expect(url).toBe(`${PAYMENT_BASE_URL}/c/checkout?variant_ids=98765&qty=1`);
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
    // Explicit format check per task spec
    expect(url).toMatch(/\/c\/checkout\?variant_ids=98765&qty=1$/);
  });

  it("paymentUrl DAN scalevVariantId keduanya ada → paymentUrl menang", async () => {
    const paymentUrl = "https://bayar.dokumenproyek.com/pl/produk-uji-langsung";
    renderFeatured(makeProduct({ scalevVariantId: 98765, paymentUrl }));
    await clickBeli("prod-1");

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toBe(paymentUrl);
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
    // Must NOT have built the variant checkout URL
    expect(String(openSpy.mock.calls[0][0])).not.toContain("/c/checkout");
  });

  it("tanpa paymentUrl dan tanpa scalevVariantId → fallback WA inquiry, bukan checkout", async () => {
    renderFeatured(makeProduct({ scalevVariantId: null, paymentUrl: null }));
    await clickBeli("prod-1");

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = String(openSpy.mock.calls[0][0]);
    expect(url).toMatch(/^https:\/\/wa\.me\//);
    expect(url).not.toContain("/c/checkout");
  });
});
