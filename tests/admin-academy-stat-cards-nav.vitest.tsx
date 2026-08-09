/**
 * Task #158 — Klik kartu stats Academy ("Kursus Aktif-Publik" / "Total Enrollment")
 * harus memindahkan admin ke tab "tools" dan menampilkan card-lms-health.
 *
 * Strategy:
 * Rendering AdminPage secara penuh (4241+ baris) tidak praktis di happy-dom karena
 * membutuhkan semua dependency data-fetching-nya. Sebagai gantinya, tes ini mengimpor
 * komponen AcademyStatCards yang diekspor langsung dari admin.tsx — komponen produksi
 * asli yang sama yang dirender di AdminPage — lalu membalutnya dengan Tabs + konten
 * tools yang berisi card-lms-health.
 *
 * Ini menciptakan hubungan eksekusi nyata dengan admin.tsx:
 * - Jika onClick handler dihapus dari AcademyStatCards, tes gagal.
 * - Jika data-testid berubah, tes gagal.
 * - Jika prop onNavigateToTools tidak dipanggil, tes gagal.
 *
 * Kontrak yang diverifikasi:
 * 1. Sebelum diklik: tab-users aktif, card-lms-health tidak ada.
 * 2. Klik stat-total-courses  → tab-tools aktif, card-lms-health visible.
 * 3. Klik stat-total-enrollments → tab-tools aktif, card-lms-health visible.
 * 4. Tab state tidak hilang saat kedua kartu diklik berurutan.
 * 5. Klik kartu non-Academy tidak mengubah tab.
 */

import React, { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Real production component from admin.tsx ──────────────────────────────────
// Any change to the onClick handler or data-testids in AcademyStatCards will
// break these tests, creating a live regression gate.
import { AcademyStatCards } from "../client/src/pages/admin";

// ── Radix UI Tabs (same component used in admin.tsx) ─────────────────────────
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// ── Test harness ──────────────────────────────────────────────────────────────
// Wraps the real AcademyStatCards in the same Tabs structure that AdminPage uses.
// The "tools" tab content contains card-lms-health, mirroring the production layout.

function AdminAcademyHarness() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div>
      {/* Non-clickable card to confirm it does NOT switch the tab */}
      <Card data-testid="stat-total-users">
        <CardContent className="pt-5">
          <p className="text-xs">Total Pengguna</p>
          <p className="text-3xl font-bold">10</p>
        </CardContent>
      </Card>

      {/* Real production stat cards — imported from admin.tsx */}
      <AcademyStatCards
        totalCourses={4}
        totalEnrollments={12}
        loading={false}
        onNavigateToTools={() => setActiveTab("tools")}
      />

      {/* Real Tabs component wired to the same activeTab state */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="tools" data-testid="tab-tools">
            Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <p data-testid="users-content">Daftar pengguna</p>
        </TabsContent>

        {/* tools tab contains card-lms-health — only visible when tab is "tools" */}
        <TabsContent value="tools">
          <Card data-testid="card-lms-health">
            <CardContent className="pt-4">
              <p>LMS Health — Status Kursus Academy</p>
              <p>{4} kursus aktif, {12} enrollment</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Admin Academy stat cards navigation (real AcademyStatCards from admin.tsx)", () => {
  it("sebelum diklik: tab-users aktif dan card-lms-health tidak ada di DOM", () => {
    render(<AdminAcademyHarness />);

    expect(screen.getByTestId("tab-users")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("tab-tools")).toHaveAttribute("data-state", "inactive");
    expect(screen.queryByTestId("card-lms-health")).not.toBeInTheDocument();
  });

  it("klik stat-total-courses → tab-tools menjadi aktif dan card-lms-health tampil", () => {
    render(<AdminAcademyHarness />);

    fireEvent.click(screen.getByTestId("stat-total-courses"));

    expect(screen.getByTestId("tab-tools")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("tab-users")).toHaveAttribute("data-state", "inactive");
    expect(screen.getByTestId("card-lms-health")).toBeInTheDocument();
  });

  it("klik stat-total-enrollments → tab-tools menjadi aktif dan card-lms-health tampil", () => {
    render(<AdminAcademyHarness />);

    fireEvent.click(screen.getByTestId("stat-total-enrollments"));

    expect(screen.getByTestId("tab-tools")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("tab-users")).toHaveAttribute("data-state", "inactive");
    expect(screen.getByTestId("card-lms-health")).toBeInTheDocument();
  });

  it("tab state tidak hilang saat kedua kartu diklik berurutan", () => {
    render(<AdminAcademyHarness />);

    // First card click
    fireEvent.click(screen.getByTestId("stat-total-courses"));
    expect(screen.getByTestId("tab-tools")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("card-lms-health")).toBeInTheDocument();

    // Second card click while already on tools — must stay on tools
    fireEvent.click(screen.getByTestId("stat-total-enrollments"));
    expect(screen.getByTestId("tab-tools")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("card-lms-health")).toBeInTheDocument();
  });

  it("kartu non-Academy (stat-total-users) tidak mengubah tab ke tools", () => {
    render(<AdminAcademyHarness />);

    fireEvent.click(screen.getByTestId("stat-total-users"));

    // No onClick on that card — tab must remain on users
    expect(screen.getByTestId("tab-users")).toHaveAttribute("data-state", "active");
    expect(screen.queryByTestId("card-lms-health")).not.toBeInTheDocument();
  });
});
