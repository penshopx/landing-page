/**
 * Task #259 — Halaman verifikasi sertifikat menampilkan nama siswa yang sama
 * dengan PDF download, khususnya kasus fallback email-prefix.
 *
 * Merender halaman produksi LmsVerify (/lms/verify/:code) dengan fetch
 * di-mock ke respons API nyata GET /api/lms/certificate/:code untuk user
 * yang HANYA punya email (tanpa first/last/display_name) → studentName
 * dari server = prefix email ("budi.santoso").
 *
 * Diverifikasi:
 * 1. Nama yang dirender = prefix email — bukan "Peserta", bukan string kosong.
 * 2. Nama muncul identik di heading utama DAN di kotak metadata "Penerima".
 * 3. Endpoint yang dipanggil memakai kode dari URL.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const CODE = "GA-TEST-EMAILPREFIX-259";

// ── Mock wouter: useParams memberi :code, Link jadi <a> ──────────────────────
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useParams: () => ({ code: CODE }),
    Link: ({ children, href, ...rest }: any) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  };
});

import LmsVerify from "../client/src/pages/lms-verify";

// ── Fixture: payload persis seperti yang dikembalikan server untuk user
//    tanpa nama/display_name — studentName sudah berupa prefix email. ─────────
const EMAIL_PREFIX = "budi.santoso";
const certPayload = {
  studentName: EMAIL_PREFIX, // dari "budi.santoso@example.com"
  course: {
    title: "Kursus AI Dasar",
    emoji: "🎓",
    color: "#6366f1",
    instructor: "Gustaf",
    category: "AI",
  },
  issuedAt: "2026-08-01T00:00:00.000Z",
  certificateCode: CODE,
};

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    if (url.includes("/api/lms/certificate/")) {
      return new Response(JSON.stringify(certPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as any;
});

afterEach(() => {
  fetchSpy.mockRestore();
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <LmsVerify />
    </QueryClientProvider>
  );
}

describe("LmsVerify — studentName fallback email-prefix", () => {
  it("menampilkan prefix email, bukan 'Peserta' dan bukan string kosong", async () => {
    renderPage();

    // Tunggu render sukses (badge valid muncul).
    await waitFor(() => {
      expect(screen.getByText("Sertifikat Valid & Asli")).toBeTruthy();
    });

    // Nama muncul di dua tempat: heading utama + metadata "Penerima".
    const nameNodes = screen.getAllByText(EMAIL_PREFIX);
    expect(nameNodes.length).toBe(2);
    const heading = nameNodes.find((n) => n.tagName === "H2");
    expect(heading).toBeTruthy();
    expect(heading!.textContent).toBe(EMAIL_PREFIX);
    expect(heading!.textContent!.trim()).not.toBe("");
    expect(heading!.textContent).not.toBe("Peserta");

    // 'Peserta' tidak muncul di mana pun sebagai nama.
    expect(screen.queryByText("Peserta")).toBeNull();
  });

  it("memanggil endpoint sertifikat dengan kode dari URL", async () => {
    renderPage();

    await waitFor(() => {
      const called = fetchSpy.mock.calls.some(([input]: any[]) => {
        const url = typeof input === "string" ? input : input?.url ?? String(input);
        return url.includes(`/api/lms/certificate/${encodeURIComponent(CODE)}`);
      });
      expect(called).toBe(true);
    });

    // Kode juga ditampilkan di halaman.
    await waitFor(() => {
      expect(screen.getAllByText(CODE).length).toBeGreaterThan(0);
    });
  });

  it("menampilkan kartu 'Sertifikat Tidak Valid' untuk kode yang tidak dikenal", async () => {
    fetchSpy.mockImplementationOnce(async () =>
      new Response(JSON.stringify({ error: "Sertifikat tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Sertifikat Tidak Valid")).toBeTruthy();
    });

    expect(screen.getAllByText(CODE).length).toBeGreaterThan(0);
    expect(screen.getByText("hello@gustafta.com")).toBeTruthy();
    expect(screen.queryByText("Sertifikat Valid & Asli")).toBeNull();
    expect(screen.queryByText(EMAIL_PREFIX)).toBeNull();
  });
});
