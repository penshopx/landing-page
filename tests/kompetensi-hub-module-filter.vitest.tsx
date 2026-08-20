/**
 * Fitur Ekosistem Kompetensi (/kompetensi-hub) — discovery berbasis Modul.
 *
 * Cakupan tes (Vitest + @testing-library/react + happy-dom):
 * 1. Filter modul sebagai dimensi utama (filterTools per modul).
 * 2. Semua tool ter-cover ke sebuah modul → tidak ada tool yang hilang.
 * 3. Pencarian mencakup label/sublabel/desc tool DAN nama/deskripsi modul,
 *    toleran huruf besar/kecil & spasi, serta bergabung dengan modul terpilih.
 * 4. Gelombang (badge/wave) BUKAN dimensi pengelompokan utama — hasil
 *    dikelompokkan per modul, bukan per gelombang.
 * 5. State URL: q & module dibaca dari URL awal, ditulis saat berubah, dan
 *    disinkron ulang saat back/forward (popstate).
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";

// ── Mock wouter Link → anchor sederhana (halaman tidak memakai hook lokasi) ──
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    Link: ({ children, href, ...rest }: any) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

import KompetensiHub, {
  TOOLS,
  TOOLS_WITH_MODULE,
  MODULES,
  TOOL_MODULE_MAP,
  MODULE_BY_ID,
  resolveModuleId,
  filterTools,
  FALLBACK_MODULE_ID,
} from "../client/src/pages/kompetensi-hub";

function setUrl(url: string) {
  window.history.replaceState(null, "", url);
}

describe("kompetensi-hub — taksonomi modul (pure logic)", () => {
  it("mengklasifikasikan SETIAP tool ke sebuah modul yang valid (tidak ada yang hilang)", () => {
    const validIds = new Set(MODULES.map((m) => m.id));
    expect(TOOLS.every((t) => Boolean(TOOL_MODULE_MAP[t.href]))).toBe(true);
    // Setiap tool punya modul valid.
    for (const t of TOOLS_WITH_MODULE) {
      expect(validIds.has(t.moduleId)).toBe(true);
    }
    // Jumlah tool yang dikelompokkan == jumlah tool total.
    const grouped = MODULES.flatMap((m) =>
      TOOLS_WITH_MODULE.filter((t) => t.moduleId === m.id),
    );
    expect(grouped.length).toBe(TOOLS.length);
    // Tidak ada href duplikat lintas modul.
    const hrefs = new Set(TOOLS_WITH_MODULE.map((t) => t.href));
    expect(hrefs.size).toBe(TOOLS.length);
  });

  it("resolveModuleId memakai peta href, dengan fallback aman untuk href tak dikenal", () => {
    const someHref = TOOLS[0].href;
    expect(resolveModuleId(someHref)).toBe(TOOL_MODULE_MAP[someHref]);
    expect(resolveModuleId("/href-tidak-ada-di-peta")).toBe(FALLBACK_MODULE_ID);
    expect(MODULE_BY_ID[FALLBACK_MODULE_ID]).toBeTruthy();
  });

  it("filter modul adalah dimensi utama: memilih modul hanya menyisakan tool modul itu", () => {
    const target = MODULES[1].id;
    const res = filterTools(TOOLS_WITH_MODULE, { module: target });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((t) => t.moduleId === target)).toBe(true);
    // "all" / kosong = semua tool.
    expect(filterTools(TOOLS_WITH_MODULE, { module: "" }).length).toBe(TOOLS.length);
    expect(filterTools(TOOLS_WITH_MODULE, { module: "all" }).length).toBe(TOOLS.length);
  });

  it("pencarian toleran huruf besar/kecil & spasi dan mencakup label tool", () => {
    const lower = filterTools(TOOLS_WITH_MODULE, { q: "jsa" });
    const upperSpaced = filterTools(TOOLS_WITH_MODULE, { q: "  JSA  " });
    expect(lower.length).toBeGreaterThan(0);
    expect(upperSpaced.map((t) => t.href).sort()).toEqual(
      lower.map((t) => t.href).sort(),
    );
  });

  it("pencarian kebutuhan mendukung banyak kata dan mengabaikan kata pengantar", () => {
    const direct = filterTools(TOOLS_WITH_MODULE, { q: "asesmen skk" });
    const conversational = filterTools(TOOLS_WITH_MODULE, {
      q: "saya butuh bantuan untuk asesmen skk",
    });
    expect(direct.length).toBeGreaterThan(0);
    expect(conversational.map((t) => t.href).sort()).toEqual(
      direct.map((t) => t.href).sort(),
    );
  });

  it("pencarian mencakup nama/deskripsi MODUL, bukan hanya metadata tool", () => {
    // Cari dengan sepotong nama modul yang tidak muncul di sebagian label tool.
    const mod = MODULES.find((m) => m.name.toLowerCase().includes("keselamatan"))!;
    const res = filterTools(TOOLS_WITH_MODULE, { q: "keselamatan" });
    // Semua tool di modul tsb harus muncul (karena nama modul cocok).
    const inModule = TOOLS_WITH_MODULE.filter((t) => t.moduleId === mod.id);
    for (const t of inModule) {
      expect(res.some((r) => r.href === t.href)).toBe(true);
    }
  });

  it("pencarian bergabung (AND) dengan modul terpilih", () => {
    const mod = MODULES[0].id;
    const res = filterTools(TOOLS_WITH_MODULE, { q: "skk", module: mod });
    expect(res.every((t) => t.moduleId === mod)).toBe(true);
    // Tidak boleh melebihi hasil modul saja.
    const modOnly = filterTools(TOOLS_WITH_MODULE, { module: mod });
    expect(res.length).toBeLessThanOrEqual(modOnly.length);
  });

  it("Gelombang (badge) BUKAN dimensi pengelompokan utama", () => {
    // Modul tidak identik dengan gelombang: satu gelombang tersebar di banyak modul.
    const waveToModules = new Map<string, Set<string>>();
    for (const t of TOOLS_WITH_MODULE) {
      const w = (t as any).badge as string;
      if (!waveToModules.has(w)) waveToModules.set(w, new Set());
      waveToModules.get(w)!.add(t.moduleId);
    }
    const spread = [...waveToModules.values()].some((s) => s.size > 1);
    expect(spread).toBe(true);
    // Dan jumlah modul jauh lebih kecil dari jumlah gelombang unik → modul
    // adalah pengelompokan yang berbeda & lebih ringkas.
    const uniqueWaves = new Set(TOOLS_WITH_MODULE.map((t) => (t as any).badge));
    expect(MODULES.length).toBeLessThan(uniqueWaves.size);
  });
});

describe("kompetensi-hub — komponen & state URL", () => {
  beforeEach(() => {
    cleanup();
    setUrl("/kompetensi-hub");
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("mengelompokkan hasil per modul (bukan per gelombang) dan menampilkan total", () => {
    render(<KompetensiHub />);
    // Setiap modul non-kosong dirender sebagai grup dengan total.
    for (const m of MODULES) {
      const group = screen.getByTestId(`module-group-${m.id}`);
      const count = within(group).getByTestId(`module-count-${m.id}`);
      const expected = TOOLS_WITH_MODULE.filter((t) => t.moduleId === m.id).length;
      expect(count).toHaveTextContent(`(${expected})`);
    }
  });

  it("filter modul primer: klik chip modul menyaring & menulis ?module ke URL", async () => {
    const pushState = vi.spyOn(window.history, "pushState");
    render(<KompetensiHub />);
    const mod = MODULES[2];
    fireEvent.click(screen.getByTestId(`module-filter-${mod.id}`));

    await waitFor(() => {
      expect(window.location.search).toContain(`module=${mod.id}`);
      expect(pushState).toHaveBeenCalled();
    });
    // Grup modul lain tidak lagi dirender.
    const other = MODULES.find((m) => m.id !== mod.id)!;
    expect(screen.queryByTestId(`module-group-${other.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`module-group-${mod.id}`)).toBeInTheDocument();
  });

  it("membaca nilai awal q & module dari URL", () => {
    const mod = MODULES[3];
    setUrl(`/kompetensi-hub?module=${mod.id}`);
    render(<KompetensiHub />);
    const chip = screen.getByTestId(`module-filter-${mod.id}`);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    // Hanya grup modul tsb yang muncul.
    expect(screen.getByTestId(`module-group-${mod.id}`)).toBeInTheDocument();
  });

  it("menulis ?q saat mencari dan menyaring kartu tool", async () => {
    render(<KompetensiHub />);
    fireEvent.change(screen.getByTestId("input-search"), {
      target: { value: "JSA" },
    });
    await waitFor(() => {
      expect(window.location.search).toContain("q=JSA");
    });
    const expected = filterTools(TOOLS_WITH_MODULE, { q: "JSA" });
    // Kartu yang tampil == hasil filter.
    for (const t of expected) {
      expect(screen.getAllByTestId(`tool-card-${t.href}`).length).toBeGreaterThan(0);
    }
  });

  it("back/forward (popstate) menyinkronkan ulang state dari URL", async () => {
    const mod = MODULES[1];
    render(<KompetensiHub />);
    fireEvent.click(screen.getByTestId(`module-filter-${mod.id}`));
    await waitFor(() =>
      expect(window.location.search).toContain(`module=${mod.id}`),
    );

    // Simulasikan tombol Back: URL kembali ke tanpa filter + popstate.
    setUrl("/kompetensi-hub");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(screen.getByTestId("module-filter-all")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    // Semua grup modul kembali muncul.
    for (const m of MODULES) {
      expect(screen.getByTestId(`module-group-${m.id}`)).toBeInTheDocument();
    }
  });

  it("menampilkan empty-state + reset ketika tidak ada hasil", () => {
    render(<KompetensiHub />);
    fireEvent.change(screen.getByTestId("input-search"), {
      target: { value: "zzz-tidak-ada-apapun-xyz" },
    });
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("button-reset-empty"));
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });
});
