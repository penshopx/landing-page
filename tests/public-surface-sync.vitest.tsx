// @vitest-environment happy-dom
import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Landing from "../client/src/pages/landing";
import {
  ChaesaWidget,
  helpdeskConfig,
  platformGuideConfig,
} from "../client/src/components/chaesa-widget";
import { SBU_SKK_FUNNEL } from "../shared/sbu-skk-ebook";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock("../client/src/components/shared-header", () => ({
  SharedHeader: () => <header data-testid="shared-header">Gustafta</header>,
}));

vi.mock("../client/src/hooks/use-auth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("../client/src/lib/meta-pixel", () => ({
  trackLead: vi.fn(),
}));

const readyQuery = {
  data: {
    id: "42",
    name: "Gustafta Helpdesk",
    slug: "gustafta-helpdesk",
    availability: "ready",
    greetingMessage: "Mulai dari cek kesiapan sebelum memilih produk.",
    conversationStarters: [
      "Saya sedang mengurus SBU. Mulai dari mana?",
      "Apa isi Mini Ebook SBU-SKK yang gratis?",
    ],
  },
  isLoading: false,
  isFetching: false,
  isError: false,
  isRefetchError: false,
  refetch: vi.fn(),
};

const readyGuideQuery = {
  ...readyQuery,
  data: {
    id: "43",
    name: "Panduan Gustafta",
    slug: "gustafta-platform-guide",
    availability: "ready",
    greetingMessage: "Saya siap memandu penggunaan platform.",
    conversationStarters: [
      "Saya baru di Gustafta. Mulai dari mana?",
      "Bagaimana menggunakan Knowledge Base?",
    ],
  },
};

function DualWidgetHarness() {
  const [open, setOpen] = useState<"helpdesk" | "guide" | null>(null);
  return (
    <>
      <ChaesaWidget
        config={helpdeskConfig}
        isOpen={open === "helpdesk"}
        onOpenChange={(next) => setOpen(next ? "helpdesk" : null)}
      />
      <ChaesaWidget
        config={platformGuideConfig}
        isOpen={open === "guide"}
        onOpenChange={(next) => setOpen(next ? "guide" : null)}
      />
    </>
  );
}

describe("public landing synchronization", () => {
  it("restores the platform breadth and keeps four priority sessions", () => {
    const { container } = render(<Landing />);

    expect(screen.getByTestId("shared-header")).toBeInTheDocument();
    expect(screen.getByTestId("section-sbu")).toBeInTheDocument();
    expect(screen.getByTestId("section-skk")).toBeInTheDocument();
    expect(screen.getByTestId("section-tender")).toBeInTheDocument();
    expect(screen.getByTestId("section-proyek")).toBeInTheDocument();
    expect(screen.getByTestId("primary-link-skk")).toHaveAttribute("href", "/skk");
    expect(screen.getByTestId("primary-link-tender")).toHaveAttribute("href", "/tender");
    expect(screen.getByTestId("primary-link-proyek")).toHaveAttribute("href", "/ruang-proyek");
    expect(screen.getByTestId("cta-hero-cek-kesiapan"))
      .toHaveAttribute("href", SBU_SKK_FUNNEL.readiness.landingPath);
    expect(screen.getByTestId("cta-funnel-readiness"))
      .toHaveAttribute("href", SBU_SKK_FUNNEL.readiness.landingPath);
    expect(screen.getByTestId("cta-funnel-mini-ebook"))
      .toHaveAttribute("href", SBU_SKK_FUNNEL.miniEbook.landingPath);
    expect(screen.getByTestId("cta-funnel-bundle"))
      .toHaveAttribute("href", SBU_SKK_FUNNEL.bundle.landingPath);
    expect(screen.getByTestId("cta-funnel-ai-specialist"))
      .toHaveAttribute("href", SBU_SKK_FUNNEL.aiSpecialist.landingPath);
    expect(screen.getByTestId("cta-final-cek-kesiapan"))
      .toHaveAttribute("href", SBU_SKK_FUNNEL.readiness.landingPath);

    for (const href of [
      "/klinik-konsultasi",
      "/bedah-dokumen",
      "/brain-project",
      "/ruang-simpan",
      "/asisten-ai",
      "/ebook",
      "/mini-apps",
      "/produk",
    ]) {
      expect(
        container.querySelector(`a[href="${href}"]`),
        `landing should retain access to ${href}`,
      ).toBeInTheDocument();
    }
  });

  it("renders the supplied videos and curated images with stable media settings", () => {
    render(<Landing />);

    const promo = screen.getByTestId("landing-video-slide-1");
    expect(promo).toHaveAttribute("controls");
    expect(promo).toHaveAttribute("autoplay");
    expect(promo).toHaveProperty("muted", true);
    expect(promo).toHaveAttribute("playsinline");
    expect(promo).toHaveAttribute("poster", expect.stringContaining("gustafta_promo_24s_poster.jpg"));
    const promoSources = promo.querySelectorAll("source");
    expect(promoSources).toHaveLength(2);
    expect(promoSources[0]).toHaveAttribute("src", expect.stringContaining("gustafta_promo_24s_web.webm"));
    expect(promoSources[0]).toHaveAttribute("type", "video/webm");
    expect(promoSources[1]).toHaveAttribute("src", expect.stringContaining("gustafta_promo_24s_web.mp4"));
    expect(promoSources[1]).toHaveAttribute("type", "video/mp4");

    const explainer = screen.getByTestId("landing-video-slide-2");
    expect(explainer).toHaveAttribute("controls");
    expect(explainer).toHaveAttribute("autoplay");
    expect(explainer).toHaveProperty("muted", true);
    expect(explainer).toHaveAttribute("playsinline");
    expect(explainer).toHaveAttribute("poster", expect.stringContaining("gustafta_explainer_poster.jpg"));
    const explainerSources = explainer.querySelectorAll("source");
    expect(explainerSources).toHaveLength(2);
    expect(explainerSources[0]).toHaveAttribute("src", expect.stringContaining("gustafta_explainer.webm"));
    expect(explainerSources[0]).toHaveAttribute("type", "video/webm");
    expect(explainerSources[1]).toHaveAttribute("src", expect.stringContaining("gustafta_explainer.mp4"));
    expect(explainerSources[1]).toHaveAttribute("type", "video/mp4");

    for (const [index, fileName] of [
      [1, "G01_1781941962427.png"],
      [2, "G03_1781941962428.png"],
      [3, "G05_1781941962429.png"],
      [4, "G07_1781941962430.png"],
    ] as const) {
      const image = screen.getByTestId(`landing-identity-slide-${index}`);
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("src", expect.stringContaining(fileName));
    }

    expect(screen.getByTestId("landing-video-previous")).toBeInTheDocument();
    expect(screen.getByTestId("landing-video-next")).toBeInTheDocument();
    expect(screen.getByTestId("landing-identity-previous")).toBeInTheDocument();
    expect(screen.getByTestId("landing-identity-next")).toBeInTheDocument();
  });

  it("moves both carousels manually while each video remains on its selected looping slide", async () => {
    render(<Landing />);

    expect(screen.getByTestId("landing-video-dot-1")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("landing-video-next"));
    expect(screen.getByTestId("landing-video-dot-2")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("landing-video-previous"));
    expect(screen.getByTestId("landing-video-dot-1")).toHaveAttribute("aria-pressed", "true");

    fireEvent.ended(screen.getByTestId("landing-video-slide-1"));
    expect(screen.getByTestId("landing-video-dot-2")).toHaveAttribute("aria-pressed", "true");
    fireEvent.ended(screen.getByTestId("landing-video-slide-2"));
    expect(screen.getByTestId("landing-video-dot-1")).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByTestId("landing-identity-dot-1")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("landing-identity-next"));
    expect(screen.getByTestId("landing-identity-dot-2")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("landing-identity-dot-4"));
    expect(screen.getByTestId("landing-identity-dot-4")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("global Help Desk widget", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockReturnValue(readyQuery);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      'data: {"content":"Silakan mulai dari cek kesiapan."}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    )));
  });

  it("renders backend-owned greeting and starters, then sends an isolated visitor session", async () => {
    render(<ChaesaWidget />);
    fireEvent.click(screen.getByTestId("button-helpdesk-toggle"));

    expect(screen.getByText(readyQuery.data.greetingMessage)).toBeInTheDocument();
    fireEvent.click(screen.getByText(readyQuery.data.conversationStarters[0]));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(init?.body));
    expect(payload.agentId).toBe("gustafta-helpdesk");
    expect(payload.sessionId).toMatch(/^chaesa-/);
    expect(payload.content).toBe(readyQuery.data.conversationStarters[0]);
    await screen.findByText("Silakan mulai dari cek kesiapan.");
  });

  it("shows an honest unavailable state with a retry action", () => {
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      isRefetchError: false,
      refetch,
    });

    render(<ChaesaWidget />);
    fireEvent.click(screen.getByTestId("button-helpdesk-toggle"));

    expect(screen.getByTestId("helpdesk-unavailable-state")).toHaveTextContent(
      "Help Desk Pekerjaan belum dapat digunakan",
    );
    expect(screen.getByTestId("input-helpdesk-message")).toBeDisabled();
    fireEvent.click(screen.getByTestId("button-helpdesk-retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("fails closed when a refetch rejects previously cached agent data", () => {
    useQueryMock.mockReturnValue({
      ...readyQuery,
      isError: false,
      isRefetchError: true,
    });

    render(<ChaesaWidget />);
    fireEvent.click(screen.getByTestId("button-helpdesk-toggle"));

    expect(screen.getByTestId("helpdesk-unavailable-state")).toBeInTheDocument();
    expect(screen.getByTestId("input-helpdesk-message")).toBeDisabled();
    expect(screen.queryByText(readyQuery.data.conversationStarters[0]))
      .not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("aborts an in-flight stream when the widget is unmounted", async () => {
    let aborted = false;
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
    ));

    const view = render(<ChaesaWidget />);
    fireEvent.click(screen.getByTestId("button-helpdesk-toggle"));
    fireEvent.click(screen.getByText(readyQuery.data.conversationStarters[0]));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    view.unmount();
    expect(aborted).toBe(true);
  });

  it("keeps metadata, labels, placement, test IDs, and open state separate", () => {
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: string[] }) =>
      queryKey[0] === platformGuideConfig.metadataEndpoint
        ? readyGuideQuery
        : readyQuery,
    );

    render(<DualWidgetHarness />);

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: [helpdeskConfig.metadataEndpoint],
    }));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: [platformGuideConfig.metadataEndpoint],
    }));

    const helpdeskToggle = screen.getByTestId("button-helpdesk-toggle");
    const guideToggle = screen.getByTestId("button-platform-guide-toggle");
    expect(helpdeskToggle.closest(".fixed")).toHaveClass("right-6");
    expect(guideToggle.closest(".fixed")).toHaveClass("left-6");
    expect(helpdeskToggle).toHaveTextContent("Help Desk Pekerjaan");
    expect(guideToggle).toHaveTextContent("Panduan Gustafta");

    fireEvent.click(helpdeskToggle);
    expect(screen.getByRole("dialog", { name: "Help Desk Pekerjaan" }))
      .toBeInTheDocument();
    expect(screen.getByTestId("input-helpdesk-message"))
      .toHaveAttribute("placeholder", "Tanya soal SBU, SKK, Tender, atau Proyek...");

    fireEvent.click(guideToggle);
    expect(screen.queryByRole("dialog", { name: "Help Desk Pekerjaan" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Panduan Gustafta" }))
      .toBeInTheDocument();
    expect(screen.getByTestId("input-platform-guide-message"))
      .toHaveAttribute("placeholder", "Tanya cara menggunakan Gustafta...");
  });

  it("sends the platform guide to its own slug and visitor session", async () => {
    useQueryMock.mockReturnValue(readyGuideQuery);
    render(<ChaesaWidget config={platformGuideConfig} />);
    fireEvent.click(screen.getByTestId("button-platform-guide-toggle"));
    fireEvent.click(screen.getByText(readyGuideQuery.data.conversationStarters[0]));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(init?.body));
    expect(payload.agentId).toBe("gustafta-platform-guide");
    expect(payload.sessionId).toMatch(/^panduan-gustafta-/);
    expect(payload.sessionId).not.toMatch(/^chaesa-/);
    expect(payload.content).toBe(readyGuideQuery.data.conversationStarters[0]);
  });

  it("aborts only the controlled widget that is closed", async () => {
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: string[] }) =>
      queryKey[0] === platformGuideConfig.metadataEndpoint
        ? readyGuideQuery
        : readyQuery,
    );
    const aborted: string[] = [];
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body));
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          aborted.push(payload.agentId);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    }));

    const view = render(
      <>
        <ChaesaWidget config={helpdeskConfig} isOpen onOpenChange={() => {}} />
        <ChaesaWidget config={platformGuideConfig} isOpen onOpenChange={() => {}} />
      </>,
    );
    fireEvent.click(screen.getByText(readyQuery.data.conversationStarters[0]));
    fireEvent.click(screen.getByText(readyGuideQuery.data.conversationStarters[0]));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    view.rerender(
      <>
        <ChaesaWidget config={helpdeskConfig} isOpen={false} onOpenChange={() => {}} />
        <ChaesaWidget config={platformGuideConfig} isOpen onOpenChange={() => {}} />
      </>,
    );
    await waitFor(() => expect(aborted).toEqual(["gustafta-helpdesk"]));

    view.unmount();
    expect(aborted).toEqual([
      "gustafta-helpdesk",
      "gustafta-platform-guide",
    ]);
  });
});