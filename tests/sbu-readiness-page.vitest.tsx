// @vitest-environment happy-dom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CekKesiapanSbuPage from "../client/src/pages/cek-kesiapan-sbu";
import {
  SBU_READINESS_QUESTIONS,
  SBU_READINESS_RUBRIC_VERSION,
} from "../shared/sbu-readiness";

vi.mock("../client/src/components/shared-header", () => ({
  SharedHeader: () => <header data-testid="shared-header">Gustafta</header>,
}));

function chooseContext(): void {
  fireEvent.click(screen.getByLabelText("Mengurus SBU pertama kali"));
  fireEvent.click(screen.getByLabelText("Kecil"));
}

function chooseEveryReadinessState(state: "none" | "partial" | "ready"): void {
  for (const question of SBU_READINESS_QUESTIONS) {
    const input = document.querySelector<HTMLInputElement>(
      `input[name="${question.id}"][value="${state}"]`,
    );
    expect(input, `missing ${question.id}:${state}`).not.toBeNull();
    fireEvent.click(input!);
  }
}

describe("Cek Kesiapan SBU public page", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
  });

  it("rejects an incomplete form without sending analytics", () => {
    render(<CekKesiapanSbuPage />);

    fireEvent.click(screen.getByTestId("sbu-readiness-submit"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tujuan pengurusan SBU belum dipilih",
    );
    expect(screen.queryByTestId("sbu-readiness-result")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("scores locally, shows the non-guarantee, and sends only aggregate dimensions", async () => {
    render(<CekKesiapanSbuPage />);
    chooseContext();
    chooseEveryReadinessState("none");

    fireEvent.click(screen.getByTestId("sbu-readiness-submit"));

    expect(screen.getByTestId("sbu-readiness-score")).toHaveTextContent("0/100");
    expect(screen.getByTestId("sbu-readiness-band")).toHaveTextContent(
      "Fondasi perlu dibangun",
    );
    expect(screen.getByTestId("sbu-readiness-disclaimer")).toHaveTextContent(
      "bukan jaminan",
    );
    expect(screen.getByTestId("sbu-readiness-disclaimer")).toHaveTextContent(
      "kanal resmi",
    );
    expect(screen.getByText("Tiga langkah berikutnya").nextElementSibling?.children)
      .toHaveLength(3);

    const primary = screen.getByTestId("sbu-readiness-primary-cta");
    expect(primary).toHaveAttribute("href", "/mini-ebook-sbu-skk");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(init?.body));
    expect(payload).toEqual({
      eventType: "result",
      band: "foundation",
      rubricVersion: SBU_READINESS_RUBRIC_VERSION,
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /answer|company|name|email|phone|document/i,
    );
  });

  it("routes a fully ready result to AI Specialist and tracks only the CTA dimension", async () => {
    render(<CekKesiapanSbuPage />);
    chooseContext();
    chooseEveryReadinessState("ready");
    fireEvent.click(screen.getByTestId("sbu-readiness-submit"));

    const primary = screen.getByTestId("sbu-readiness-primary-cta");
    expect(primary).toHaveAttribute("href", "/sbu-claw");
    fireEvent.click(primary);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [, init] = vi.mocked(fetch).mock.calls[1];
    expect(JSON.parse(String(init?.body))).toEqual({
      eventType: "cta",
      band: "validate",
      destination: "ai-specialist",
      rubricVersion: SBU_READINESS_RUBRIC_VERSION,
    });
  });
});