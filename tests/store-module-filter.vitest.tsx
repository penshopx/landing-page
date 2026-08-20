/**
 * Task #388 — Filter modul di halaman Store (frontend)
 *
 * Tes komponen menggunakan Vitest + @testing-library/react + happy-dom.
 * Fetch di-intercept agar /api/store/catalog dkk. bisa dikontrol deterministik.
 *
 * Yang diverifikasi:
 * 1. Filter modul dirender dari GET /api/store/catalog/modules.
 * 2. Klik chip modul → request katalog menyertakan ?module=<slug> & reset page.
 * 3. Nilai awal `module` dibaca dari URL dan langsung dikirim ke katalog.
 * 4. Memilih modul menulis URL yang dapat dibagikan (?module=<slug>).
 * 5. Kartu produk menampilkan nama modul + tier Biasa/Premium dari premiumClass.
 * 6. Payload legacy tanpa field modul/premiumClass tetap berfungsi (default Biasa).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
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

// ── Mock cart hook & drawer ─────────────────────────────────────────────────
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

const MODULES = [
  { id: 1, slug: "sbu", name: "SBU", count: 5, standardCount: 3, premiumCount: 2 },
  { id: 2, slug: "skk", name: "SKK", count: 2, standardCount: 2, premiumCount: 0 },
];

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
    scalevVariantId: 999,
    ...overrides,
  };
}

/** Build a fetch spy that records catalog URLs and serves the given product. */
function buildFetchSpy(product: Record<string, unknown>, calls: string[]) {
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
    if (urlStr.includes("/api/store/catalog/modules")) {
      return Promise.resolve(jsonResponse(MODULES));
    }
    if (urlStr.includes("/api/store/catalog")) {
      calls.push(urlStr);
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

function renderStore(product: Record<string, unknown>) {
  const calls: string[] = [];
  const queryClient = makeQueryClient();
  (global as any).fetch = buildFetchSpy(product, calls);
  render(
    <QueryClientProvider client={queryClient}>
      <Store />
    </QueryClientProvider>
  );
  return calls;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Store — filter modul", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Clear any DOM left behind by a prior test file (no global auto-cleanup).
    cleanup();
    originalFetch = global.fetch;
    window.localStorage.clear();
    window.history.replaceState({}, "", "/store");
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("merender chip modul dari /api/store/catalog/modules", async () => {
    renderStore(makeProduct());
    expect(await screen.findByTestId("module-filter-sbu")).toBeInTheDocument();
    expect(screen.getByTestId("module-filter-skk")).toBeInTheDocument();
    expect(screen.getByTestId("module-filter-all")).toBeInTheDocument();
  });

  it("klik chip modul menambahkan ?module=<slug> ke request katalog & menulis URL", async () => {
    const calls = renderStore(makeProduct());
    const chip = await screen.findByTestId("module-filter-sbu");
    fireEvent.click(chip);

    await waitFor(() => {
      expect(calls.some((u) => u.includes("module=sbu"))).toBe(true);
    });
    expect(window.location.search).toContain("module=sbu");
  });

  it("membaca nilai awal `module` dari URL dan mengirimkannya ke katalog", async () => {
    window.history.replaceState({}, "", "/store?module=skk");
    const calls = renderStore(makeProduct());
    await waitFor(() => {
      expect(calls.some((u) => u.includes("module=skk"))).toBe(true);
    });
  });

  it("menampilkan nama modul + tier Premium dari premiumClass existing", async () => {
    renderStore(
      makeProduct({ moduleName: "SBU", moduleSlug: "sbu", premiumClass: "private" })
    );
    expect(await screen.findByTestId("module-name-prod-1")).toHaveTextContent("SBU");
    const tier = await screen.findByTestId("badge-tier-prod-1");
    expect(tier).toHaveTextContent("Premium");
  });

  it("payload legacy tanpa premiumClass → tier default Biasa", async () => {
    renderStore(makeProduct());
    const tier = await screen.findByTestId("badge-tier-prod-1");
    expect(tier).toHaveTextContent("Biasa");
    // Tanpa moduleName, chip nama modul di kartu tidak dirender.
    expect(screen.queryByTestId("module-name-prod-1")).not.toBeInTheDocument();
  });
});

describe("Store — pencarian berbasis kebutuhan", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    cleanup();
    originalFetch = global.fetch;
    window.localStorage.clear();
    window.history.replaceState({}, "", "/store");
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("menampilkan copy pencarian berbasis kebutuhan (placeholder + petunjuk)", async () => {
    renderStore(makeProduct());
    const input = await screen.findByTestId("input-search-store");
    // Placeholder mengajak mengetik kebutuhan/hasil, bukan sekadar nama produk.
    expect((input as HTMLInputElement).placeholder.toLowerCase()).toContain("kebutuhan");
    expect(await screen.findByTestId("search-hint")).toBeInTheDocument();
  });

  it("mengetik kebutuhan lalu Cari → request katalog menyertakan ?search=<kebutuhan>", async () => {
    const calls = renderStore(makeProduct());
    const pushState = vi.spyOn(window.history, "pushState");
    const input = await screen.findByTestId("input-search-store");
    fireEvent.change(input, { target: { value: "urus sbu" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(calls.some((u) => /[?&]search=urus(\+|%20)sbu/.test(u))).toBe(true);
      expect(pushState).toHaveBeenCalled();
    });
  });

  it("membaca q dari URL yang dibagikan → mengisi search box & mengirim ke katalog (paritas q/search)", async () => {
    // Shareable URL uses ?q=...; the client seeds the search from q and issues a
    // catalog request carrying that same term (server treats q & search alike).
    window.history.replaceState({}, "", "/store?q=hitung%20rab");
    const calls = renderStore(makeProduct());

    const input = await screen.findByTestId("input-search-store");
    expect((input as HTMLInputElement).value).toBe("hitung rab");
    await waitFor(() => {
      expect(calls.some((u) => /[?&]search=hitung(\+|%20)rab/.test(u))).toBe(true);
    });
    // Shareable q URL is preserved after mount.
    expect(window.location.search).toContain("q=hitung");
  });

  it("hasil kosong menampilkan pesan yang mengajak mendeskripsikan kebutuhan", async () => {
    // Serve an empty catalog for a query so the need-based empty state renders.
    window.history.replaceState({}, "", "/store?q=xyztidakada");
    const calls: string[] = [];
    const queryClient = makeQueryClient();
    (global as any).fetch = vi.fn((url: string | URL | Request): Promise<Response> => {
      const urlStr =
        typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
      if (urlStr.includes("/api/store/catalog/categories")) return Promise.resolve(jsonResponse([]));
      if (urlStr.includes("/api/store/catalog/modules")) return Promise.resolve(jsonResponse(MODULES));
      if (urlStr.includes("/api/store/catalog")) {
        calls.push(urlStr);
        return Promise.resolve(jsonResponse({ items: [], total: 0, page: 1, limit: 18, pages: 0 }));
      }
      if (urlStr.includes("/api/subscriptions/status"))
        return Promise.resolve(jsonResponse({ clientKey: "", paymentConfigured: false, isSandbox: true }));
      if (urlStr.includes("/api/config/contact")) return Promise.resolve(jsonResponse(CONTACT_RESPONSE));
      return Promise.resolve(new Response(JSON.stringify({ error: "not found" }), { status: 404 }));
    });
    render(
      <QueryClientProvider client={queryClient}>
        <Store />
      </QueryClientProvider>
    );

    const title = await screen.findByTestId("empty-search-title");
    expect(title.textContent?.toLowerCase()).toContain("kebutuhan");
    const hint = await screen.findByTestId("empty-search-hint");
    expect(hint.textContent?.toLowerCase()).toContain("kebutuhan");
  });
});
