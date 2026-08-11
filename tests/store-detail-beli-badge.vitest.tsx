/**
 * Task #221 — Badge kurasi muncul di kartu Beli pada dialog detail Store
 *
 * Tes komponen menggunakan Vitest + @testing-library/react + happy-dom.
 * Fetch di-intercept agar /api/store/catalog dkk. bisa dikontrol deterministik.
 *
 * Yang diverifikasi (di dialog detail, area kartu Beli / "Biaya Aktivasi"):
 * 1. isGustafta=true → badge-beli-gustafta-official-* visible, lainnya tidak.
 * 2. isCertified=true → badge-beli-bersertifikat-* visible, lainnya tidak.
 * 3. isCreatorMade=true → badge-beli-pra-sertifikasi-* visible, lainnya tidak.
 * 4. Semua flag false → tidak ada badge beli yang muncul.
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
    useLocation: () => ["/store", vi.fn()],
    Link: ({ children, href, ...rest }: any) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

// ── Mock cart hook & drawer (tidak relevan untuk badge) ─────────────────────
vi.mock("@/hooks/use-cart", () => ({
  useCart: () => ({
    addItem: vi.fn(),
    totalItems: 0,
    openCart: vi.fn(),
    items: [],
  }),
}));
vi.mock("@/components/cart-drawer", () => ({
  CartDrawer: () => <div data-testid="mock-cart-drawer" />,
}));

// ── Mock meta pixel helpers ──────────────────────────────────────────────────
vi.mock("@/lib/meta-pixel", () => ({
  trackLead: vi.fn(),
  trackViewContent: vi.fn(),
  trackInitiateCheckout: vi.fn(),
}));

// ── Component under test ─────────────────────────────────────────────────────
import Store from "../client/src/pages/store";
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
  primaryDisplay: "081287941900",
  secondaryDisplay: "082299417818",
  waLink: "https://wa.me/6281287941900",
  waLink2: "https://wa.me/6282299417818",
};

/** Produk katalog minimal; agentId=null agar tombol Detail membuka dialog. */
function makeProduct(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "prod-1",
    name: "Produk Uji Coba",
    category: "engineering",
    tagline: "Tagline uji",
    description: "Deskripsi produk uji.",
    productSummary: "Ringkasan produk uji.",
    productFeatures: ["Fitur A", "Fitur B"],
    emoji: "🤖",
    color: "#7c3aed",
    price: 250000,
    originalPrice: null,
    agentId: null,
    isGustafta: false,
    isCreatorMade: false,
    isCertified: false,
    licenseClass: null,
    paymentUrl: null,
    scalevVariantId: null,
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

    if (urlStr.includes("/api/store/catalog/categories")) {
      return Promise.resolve(jsonResponse([]));
    }
    if (urlStr.includes("/api/store/catalog")) {
      return Promise.resolve(
        jsonResponse({ items: [product], total: 1, page: 1, limit: 18, pages: 1 })
      );
    }
    if (urlStr.includes("/api/subscriptions/status")) {
      return Promise.resolve(
        jsonResponse({ clientKey: "", paymentConfigured: false, isSandbox: true })
      );
    }
    if (urlStr.includes("/api/config/contact")) {
      return Promise.resolve(jsonResponse(CONTACT_RESPONSE));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ error: "not found" }), { status: 404 })
    );
  });
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "returnNull" }),
        retry: false,
      },
    },
  });
}

/** Render Store, tunggu kartu produk, lalu buka dialog detail. */
async function openDetailDialog(product: Record<string, unknown>) {
  const queryClient = makeQueryClient();
  (global as any).fetch = buildFetchSpy(product);
  render(
    <QueryClientProvider client={queryClient}>
      <Store />
    </QueryClientProvider>
  );

  const detailButton = await screen.findByTestId(
    `button-detail-${product.id}`,
    {},
    { timeout: 5000 }
  );
  fireEvent.click(detailButton);

  // Dialog terbuka — kartu Beli memuat label "Biaya Aktivasi"
  await waitFor(
    () => expect(screen.getAllByText("Biaya Aktivasi").length).toBeGreaterThanOrEqual(2),
    { timeout: 5000 }
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Store detail dialog — badge kurasi di kartu Beli", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    window.localStorage.clear();
    window.history.replaceState({}, "", "/store");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("menampilkan badge Gustafta Official saat isGustafta=true", async () => {
    await openDetailDialog(makeProduct({ isGustafta: true }));

    const badge = screen.getByTestId("badge-beli-gustafta-official-prod-1");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Gustafta Official");
    expect(screen.queryByTestId("badge-beli-bersertifikat-prod-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("badge-beli-pra-sertifikasi-prod-1")).not.toBeInTheDocument();
  });

  it("menampilkan badge Bersertifikat saat isCertified=true dan isGustafta=false", async () => {
    await openDetailDialog(makeProduct({ isCertified: true }));

    const badge = screen.getByTestId("badge-beli-bersertifikat-prod-1");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Bersertifikat");
    expect(screen.queryByTestId("badge-beli-gustafta-official-prod-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("badge-beli-pra-sertifikasi-prod-1")).not.toBeInTheDocument();
  });

  it("menampilkan badge Pra-Sertifikasi saat isCreatorMade=true saja", async () => {
    await openDetailDialog(makeProduct({ isCreatorMade: true }));

    const badge = screen.getByTestId("badge-beli-pra-sertifikasi-prod-1");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Pra-Sertifikasi");
    expect(screen.queryByTestId("badge-beli-gustafta-official-prod-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("badge-beli-bersertifikat-prod-1")).not.toBeInTheDocument();
  });

  it("tidak menampilkan badge beli saat semua flag kurasi false", async () => {
    await openDetailDialog(makeProduct());

    expect(screen.queryByTestId("badge-beli-gustafta-official-prod-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("badge-beli-bersertifikat-prod-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("badge-beli-pra-sertifikasi-prod-1")).not.toBeInTheDocument();
  });
});
