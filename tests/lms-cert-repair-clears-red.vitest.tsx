/**
 * Task #176 — Kartu health: sel "Selesai Tanpa Sertifikat" berhenti merah dan
 * tombol Perbaiki hilang setelah cert-repair sukses + onRefresh() resolve.
 *
 * Merender komponen produksi LmsHealthCard (diekspor dari admin-academy.tsx)
 * dengan fetch di-mock:
 * - Fase 1: pendingCertificates=2 → sel merah + tombol "Perbaiki" tampil.
 * - Klik Perbaiki → POST /api/admin/lms/cert-repair terpanggil, onRefresh
 *   dipanggil, lalu health di-update ke pendingCertificates=0.
 * - Fase 2: sel tidak lagi merah (bg-muted/50, teks hijau) dan tombol hilang.
 */

import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LmsHealthCard } from "../client/src/pages/admin-academy";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeHealth(pending: number) {
  return {
    seedStatus: "done",
    seeding: false,
    counts: {
      totalCourses: 4,
      activeCourses: 4,
      totalLessons: 12,
      totalEnrollments: 7,
      totalCertificates: 5,
      pendingCertificates: pending,
    },
    lastBackfill: null,
  };
}

// ── Harness: simulates the parent's health query + onRefresh ─────────────────

const onRefreshSpy = vi.fn();

function Harness() {
  const [health, setHealth] = useState<any>(makeHealth(2));
  const onRefresh = () => {
    onRefreshSpy();
    // Simulate the refetched health after a successful repair.
    setHealth(makeHealth(0));
  };
  return (
    <LmsHealthCard
      health={health}
      isLoading={false}
      onRefresh={onRefresh}
      updatedAt={Date.now()}
    />
  );
}

function renderHarness() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <Harness />
    </QueryClientProvider>
  );
}

// ── Fetch mock ────────────────────────────────────────────────────────────────

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  onRefreshSpy.mockClear();
  fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input?.url ?? String(input);
    if (url.includes("/api/admin/lms/cert-repair")) {
      return new Response(
        JSON.stringify({ ok: true, backfilled: 2, total: 2, stillPending: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LmsHealthCard — pendingCertificates cell", () => {
  it("shows red highlight and Perbaiki button while pendingCertificates > 0", () => {
    renderHarness();

    const cell = screen.getByTestId("cell-lms-pending-certs");
    expect(cell.className).toContain("bg-red-50");

    const value = screen.getByTestId("text-lms-pending-certs");
    expect(value.textContent).toBe("2");
    expect(value.className).toContain("text-red-600");

    expect(screen.getByTestId("button-lms-cert-repair")).toBeTruthy();
  });

  it("clears the red highlight and hides the Repair button after repair + onRefresh resolve", async () => {
    renderHarness();

    fireEvent.click(screen.getByTestId("button-lms-cert-repair"));

    // Repair endpoint must be called.
    await waitFor(() => {
      const calledRepair = fetchSpy.mock.calls.some(([input]: any[]) => {
        const url = typeof input === "string" ? input : input?.url ?? String(input);
        return url.includes("/api/admin/lms/cert-repair");
      });
      expect(calledRepair).toBe(true);
    });

    // onRefresh must have been invoked by the mutation's onSuccess.
    await waitFor(() => expect(onRefreshSpy).toHaveBeenCalledTimes(1));

    // After the refreshed health (pending=0) renders:
    await waitFor(() => {
      const value = screen.getByTestId("text-lms-pending-certs");
      expect(value.textContent).toBe("0");
    });

    const cell = screen.getByTestId("cell-lms-pending-certs");
    expect(cell.className).not.toContain("bg-red-50");
    expect(cell.className).toContain("bg-muted/50");

    const value = screen.getByTestId("text-lms-pending-certs");
    expect(value.className).toContain("text-green-600");
    expect(value.className).not.toContain("text-red-600");

    // Repair button must be gone.
    expect(screen.queryByTestId("button-lms-cert-repair")).toBeNull();
  });
});
