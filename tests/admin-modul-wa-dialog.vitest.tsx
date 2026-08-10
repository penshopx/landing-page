/**
 * Task #200 — modul-subs WA dialog: "WA Langsung" label + malformed-phone toast guard.
 *
 * Strategy (mirrors admin-academy-stat-cards-nav.vitest.tsx):
 * Rendering AdminPage fully is impractical in happy-dom, so this test imports the
 * real ModulWaDialogBody component exported from admin.tsx — the same production
 * component rendered inside the modul WA dialog.
 *
 * Contracts verified:
 * 1. Valid phone ("628123456789") → button label "WA Langsung", click opens
 *    wa.me/<phone> in a new tab, no toast.
 * 2. Malformed phone ("08abc") → button label "Buka WA", click fires a
 *    destructive "Nomor tidak valid" toast and does NOT navigate (no window.open).
 * 3. Leading-0 phone is normalized to 62-prefix in the wa.me URL.
 * 4. No phone at all → "Buka WA" opens the text-only wa.me URL.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Toast mock: capture toast calls from the real component ──────────────────
const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

// ── Real production component from admin.tsx ─────────────────────────────────
import { ModulWaDialogBody } from "../client/src/pages/admin";
import type { ComponentProps } from "react";

type ModulSub = ComponentProps<typeof ModulWaDialogBody>["sub"];

function makeSub(overrides: Partial<ModulSub> = {}): ModulSub {
  return {
    id: 1,
    bigIdeaId: 42,
    agentId: null,
    productName: "Paket Modul Kontraktor",
    productType: "modul",
    customerName: "Budi",
    customerEmail: "budi@example.com",
    customerPhone: null,
    plan: "monthly",
    status: "active",
    amount: 99000,
    accessToken: "tok",
    startDate: null,
    endDate: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderDialog(sub: ModulSub) {
  return render(
    <ModulWaDialogBody
      sub={sub}
      appUrl="https://gustafta.my.id"
      contactDisplay="0812-1111-2222"
      contactDisplay2="0812-3333-4444"
    />
  );
}

let openSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  toastSpy.mockClear();
  openSpy = vi.fn();
  vi.stubGlobal("open", openSpy);
});

describe("Modul WA dialog (real ModulWaDialogBody from admin.tsx)", () => {
  it('nomor valid "628123456789" → tombol berlabel "WA Langsung" dan membuka wa.me/<nomor>', () => {
    renderDialog(makeSub({ customerPhone: "628123456789" }));

    const btn = screen.getByTestId("button-open-modul-wa");
    expect(btn).toHaveTextContent("WA Langsung");

    fireEvent.click(btn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target] = openSpy.mock.calls[0];
    expect(url).toMatch(/^https:\/\/wa\.me\/628123456789\?text=/);
    expect(target).toBe("_blank");
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it('nomor malformed "08abc" → klik "Buka WA" memunculkan toast destruktif, TIDAK navigasi', () => {
    renderDialog(makeSub({ customerPhone: "08abc" }));

    const btn = screen.getByTestId("button-open-modul-wa");
    // Not a valid E.164 number → label falls back to "Buka WA"
    expect(btn).toHaveTextContent("Buka WA");
    expect(btn).not.toHaveTextContent("WA Langsung");

    fireEvent.click(btn);

    // No navigation on a broken number
    expect(openSpy).not.toHaveBeenCalled();
    // Destructive toast explains the problem
    expect(toastSpy).toHaveBeenCalledTimes(1);
    const toastArg = toastSpy.mock.calls[0][0];
    expect(toastArg.title).toBe("Nomor tidak valid");
    expect(toastArg.variant).toBe("destructive");
    expect(toastArg.description).toContain("08abc");
  });

  it('nomor berawalan 0 ("081234567890") dinormalisasi ke prefix 62 di URL wa.me', () => {
    renderDialog(makeSub({ customerPhone: "081234567890" }));

    const btn = screen.getByTestId("button-open-modul-wa");
    expect(btn).toHaveTextContent("WA Langsung");

    fireEvent.click(btn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
  });

  it('tanpa nomor → "Buka WA" membuka wa.me text-only (tanpa nomor), tanpa toast error', () => {
    renderDialog(makeSub({ customerPhone: null }));

    const btn = screen.getByTestId("button-open-modul-wa");
    expect(btn).toHaveTextContent("Buka WA");

    fireEvent.click(btn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it('nomor terlalu pendek ("6281") → dianggap tidak valid, toast destruktif tanpa navigasi', () => {
    renderDialog(makeSub({ customerPhone: "6281" }));

    const btn = screen.getByTestId("button-open-modul-wa");
    expect(btn).toHaveTextContent("Buka WA");

    fireEvent.click(btn);

    expect(openSpy).not.toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledTimes(1);
    expect(toastSpy.mock.calls[0][0].title).toBe("Nomor tidak valid");
  });
});
