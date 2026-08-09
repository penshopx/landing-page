/**
 * Task #142 — Badge kurasi muncul di seksi Beli untuk tiga jenis badge
 *
 * Tes komponen menggunakan Vitest + @testing-library/react + happy-dom.
 * Fetch di-intercept agar endpoint /api/landing/:id dan /api/config/contact
 * bisa dikontrol secara deterministik.
 *
 * Yang diverifikasi:
 * 1. isGustafta=true → badge-beli-gustafta-official-* visible, lainnya tidak.
 * 2. isCertified=true (isGustafta=false) → badge-beli-bersertifikat-* visible, lainnya tidak.
 * 3. isCreatorMade=true (isGustafta=false, isCertified=false) → badge-beli-pra-sertifikasi-* visible, lainnya tidak.
 * 4. Semua flag false → tidak ada badge beli yang muncul.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock wouter so useParams returns a predictable agentId ──────────────────
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useParams: () => ({ agentId: "test-agent-id" }),
    useRoute: () => [true, { agentId: "test-agent-id" }],
    Link: ({ children, href, ...rest }: any) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

// ── Mock DemoChat to avoid unrelated API calls and render complexity ─────────
vi.mock("@/components/demo-chat", () => ({
  default: () => <div data-testid="mock-demo-chat" />,
}));

// ── Component under test ─────────────────────────────────────────────────────
import ProductLanding from "../client/src/pages/product-landing";
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

/** Minimal agent data that satisfies the product-landing rendering path. */
function makeAgent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "test-agent-id",
    name: "Agen Uji Coba",
    description: "Deskripsi singkat agen.",
    avatar: null,
    landingPageEnabled: true,
    isGustafta: false,
    isCertified: false,
    isCreatorMade: false,
    monthlyPrice: 99000,
    conversionOffers: [],
    landingHeroCtaText: "Coba Sekarang",
    landingHeroHeadline: null,
    landingHeroSubheadline: null,
    landingFeatureBullets: null,
    landingBenefits: null,
    landingTestimonials: null,
    landingFaqs: null,
    landingDemoItems: null,
    landingAuthority: null,
    landingUrgencyText: null,
    landingGuaranteeText: null,
    metaPixelId: null,
    paymentUrl: null,
    scalevVariantId: null,
    ...overrides,
  };
}

function buildFetchSpy(agent: Record<string, unknown>) {
  return vi.fn((url: string | URL | Request): Promise<Response> => {
    const urlStr =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.href
          : (url as Request).url;

    if (urlStr.includes("/api/landing/")) {
      return Promise.resolve(jsonResponse(agent));
    }
    if (urlStr.includes("/api/config/contact")) {
      return Promise.resolve(jsonResponse(CONTACT_RESPONSE));
    }
    // Default 404 for anything unexpected
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
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
}

function renderLanding(agent: Record<string, unknown>) {
  const queryClient = makeQueryClient();
  (global as any).fetch = buildFetchSpy(agent);
  render(
    <QueryClientProvider client={queryClient}>
      <ProductLanding />
    </QueryClientProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProductLanding — badge kurasi di seksi Beli", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── Test 1: Gustafta Official ──────────────────────────────────────────────

  it("menampilkan badge Gustafta Official saat isGustafta=true", async () => {
    renderLanding(makeAgent({ isGustafta: true }));

    await waitFor(
      () =>
        expect(
          screen.getByTestId("badge-beli-gustafta-official-test-agent-id")
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );

    expect(screen.getByTestId("badge-beli-gustafta-official-test-agent-id")).toHaveTextContent(
      "Gustafta Official"
    );
    expect(
      screen.queryByTestId("badge-beli-bersertifikat-test-agent-id")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("badge-beli-pra-sertifikasi-test-agent-id")
    ).not.toBeInTheDocument();
  });

  // ── Test 2: Bersertifikat ─────────────────────────────────────────────────

  it("menampilkan badge Bersertifikat saat isCertified=true dan isGustafta=false", async () => {
    renderLanding(makeAgent({ isCertified: true }));

    await waitFor(
      () =>
        expect(
          screen.getByTestId("badge-beli-bersertifikat-test-agent-id")
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );

    expect(screen.getByTestId("badge-beli-bersertifikat-test-agent-id")).toHaveTextContent(
      "Bersertifikat"
    );
    expect(
      screen.queryByTestId("badge-beli-gustafta-official-test-agent-id")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("badge-beli-pra-sertifikasi-test-agent-id")
    ).not.toBeInTheDocument();
  });

  // ── Test 3: Pra-Sertifikasi ───────────────────────────────────────────────

  it("menampilkan badge Pra-Sertifikasi saat isCreatorMade=true, isGustafta=false, isCertified=false", async () => {
    renderLanding(makeAgent({ isCreatorMade: true }));

    await waitFor(
      () =>
        expect(
          screen.getByTestId("badge-beli-pra-sertifikasi-test-agent-id")
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );

    expect(screen.getByTestId("badge-beli-pra-sertifikasi-test-agent-id")).toHaveTextContent(
      "Pra-Sertifikasi"
    );
    expect(
      screen.queryByTestId("badge-beli-gustafta-official-test-agent-id")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("badge-beli-bersertifikat-test-agent-id")
    ).not.toBeInTheDocument();
  });

  // ── Test 4: Tidak ada badge saat semua flag false ─────────────────────────

  it("tidak menampilkan badge beli apapun saat semua flag kurasi false", async () => {
    renderLanding(makeAgent()); // default: semua false

    // Tunggu sampai pricing section muncul (monthlyPrice > 0)
    await waitFor(
      () =>
        expect(screen.getByText("Pilih Paket yang Tepat")).toBeInTheDocument(),
      { timeout: 5000 }
    );

    expect(
      screen.queryByTestId("badge-beli-gustafta-official-test-agent-id")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("badge-beli-bersertifikat-test-agent-id")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("badge-beli-pra-sertifikasi-test-agent-id")
    ).not.toBeInTheDocument();
  });

  // ── Test 5: Gustafta Official mengalahkan isCertified ─────────────────────

  it("isGustafta=true mengalahkan isCertified=true — hanya badge Gustafta Official yang muncul", async () => {
    renderLanding(makeAgent({ isGustafta: true, isCertified: true }));

    await waitFor(
      () =>
        expect(
          screen.getByTestId("badge-beli-gustafta-official-test-agent-id")
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );

    expect(
      screen.queryByTestId("badge-beli-bersertifikat-test-agent-id")
    ).not.toBeInTheDocument();
  });

  // ── Test 6: isCertified mengalahkan isCreatorMade ─────────────────────────

  it("isCertified=true mengalahkan isCreatorMade=true — hanya badge Bersertifikat yang muncul", async () => {
    renderLanding(makeAgent({ isCertified: true, isCreatorMade: true }));

    await waitFor(
      () =>
        expect(
          screen.getByTestId("badge-beli-bersertifikat-test-agent-id")
        ).toBeInTheDocument(),
      { timeout: 5000 }
    );

    expect(
      screen.queryByTestId("badge-beli-pra-sertifikasi-test-agent-id")
    ).not.toBeInTheDocument();
  });
});
