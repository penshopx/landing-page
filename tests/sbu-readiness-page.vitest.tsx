// @vitest-environment happy-dom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CekKesiapanSbuPage from "../client/src/pages/cek-kesiapan-sbu";
import CekKelayakanSkkPage from "../client/src/pages/cek-kelayakan-skk";
import DiagnostikKompetensiPage from "../client/src/pages/diagnostik-kompetensi";

vi.mock("../client/src/components/shared-header", () => ({
  SharedHeader: () => <header data-testid="shared-header">Gustafta</header>,
}));

describe("Public SBU-SKK readiness previews", () => {
  it.each([
    ["SBU", <CekKesiapanSbuPage />],
    ["SKK", <CekKelayakanSkkPage />],
    ["kompetensi", <DiagnostikKompetensiPage />],
  ])("keeps %s public page as preview without a scoring form", (_label, page) => {
    render(page);

    expect(screen.getByText(/Akses diagnosis setelah order paid/i))
      .toBeInTheDocument();
    expect(screen.getByText(/Jawaban mentah tidak disimpan/i))
      .toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    const packageLinks = screen.getAllByRole("link", {
      name: /Paket Level 1/i,
    });
    expect(packageLinks.length).toBeGreaterThan(0);
    expect(packageLinks[0]).toHaveAttribute("href", "/ebook-sbu-skk");
  });
});