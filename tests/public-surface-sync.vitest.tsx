// @vitest-environment happy-dom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Landing from "../client/src/pages/landing";
import { ChaesaWidget } from "../client/src/components/chaesa-widget";
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
      "Help Desk belum dapat digunakan",
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
});