/**
 * Task #266 — store WA dialog: digital-product template vs chatbot template.
 *
 * Task #173 fixed the dialog to derive isDigital SOLELY from the order's own
 * downloadPath field (joined server-side in GET /api/store/admin/orders),
 * never from a separate storeProducts lookup that may not have loaded yet.
 * These tests pin that contract so a refactor can't silently reintroduce the
 * fallback to the chatbot template.
 *
 * Strategy (mirrors tests/admin-modul-wa-dialog.vitest.tsx): rendering the full
 * AdminPage in happy-dom is impractical, so we import the REAL production
 * exports from admin.tsx — storeWaDialogTitle (the exact expression used in the
 * DialogTitle) and StoreWaDialogBody (the exact component rendered inside the
 * dialog).
 *
 * Contracts verified:
 * 1. Order WITH downloadPath → title "Kirim Konfirmasi File Digital via WA",
 *    body uses the digital template (product name + email mention), and the
 *    chatbot-specific copy is absent.
 * 2. The digital message's download link is the payment-validated access page
 *    (/store/access/<token>) — never the raw storage path.
 * 3. Order WITHOUT downloadPath (chatbot) → title "Kirim Link Akses Chatbot via
 *    WA" and the chatbot template body.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Toast mock: StoreWaDialogBody calls useToast() ───────────────────────────
const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

// ── Real production exports from admin.tsx ───────────────────────────────────
import { StoreWaDialogBody, storeWaDialogTitle, type StoreWaOrder } from "../client/src/pages/admin";

function makeOrder(overrides: Partial<StoreWaOrder> = {}): StoreWaOrder {
  return {
    id: 1,
    productId: 10,
    customerName: "Budi",
    customerEmail: "budi@example.com",
    customerPhone: "",
    amount: 149000,
    status: "paid",
    midtransOrderId: "GSTORE-001",
    accessToken: "tok-abc123",
    createdAt: new Date().toISOString(),
    downloadPath: null,
    productName: null,
    ...overrides,
  };
}

function renderBody(order: StoreWaOrder) {
  return render(
    <StoreWaDialogBody
      order={order}
      appUrl="https://gustafta.my.id"
      contactDisplay="0812-1111-2222"
      contactDisplay2="0812-3333-4444"
    />
  );
}

beforeEach(() => {
  toastSpy.mockClear();
});

describe("Store WA dialog — digital order (downloadPath set)", () => {
  const digitalOrder = makeOrder({
    downloadPath: "products/toolkit-cashflow.zip",
    productName: "Toolkit Cashflow PBJ",
  });

  it('judul dialog = "Kirim Konfirmasi File Digital via WA"', () => {
    expect(storeWaDialogTitle(digitalOrder)).toBe("Kirim Konfirmasi File Digital via WA");
  });

  it("pesan memakai template file digital (nama produk + email), bukan template chatbot", () => {
    renderBody(digitalOrder);
    const msg = screen.getByTestId("store-wa-msg-preview").textContent ?? "";

    // Digital template markers
    expect(msg).toContain("Toolkit Cashflow PBJ");
    expect(msg).toContain("File digital Anda sudah dikirim ke email budi@example.com");
    expect(msg).toContain("Anda juga bisa langsung download di sini:");

    // Chatbot template must NOT appear
    expect(msg).not.toContain("Terima kasih sudah membeli Chatbot");
    expect(msg).not.toContain("Chat langsung dengan AI Chatbot Anda");
    expect(msg).not.toContain("Kode embed");
  });

  it("link download = halaman akses tervalidasi, bukan raw storage path", () => {
    renderBody(digitalOrder);
    const msg = screen.getByTestId("store-wa-msg-preview").textContent ?? "";

    // The access-page URL (validates payment, resolves a fresh 24h link)
    expect(msg).toContain("https://gustafta.my.id/store/access/tok-abc123");
    // Never the raw downloadPath from storage
    expect(msg).not.toContain("products/toolkit-cashflow.zip");

    // Link Akses input shows the same access URL
    const input = screen.getByTestId("input-store-access-link") as HTMLInputElement;
    expect(input.value).toBe("https://gustafta.my.id/store/access/tok-abc123");
  });
});

describe("Store WA dialog — chatbot order (no downloadPath)", () => {
  const chatbotOrder = makeOrder({ downloadPath: null, productName: "Tim AI Kontraktor" });

  it('judul dialog = "Kirim Link Akses Chatbot via WA"', () => {
    expect(storeWaDialogTitle(chatbotOrder)).toBe("Kirim Link Akses Chatbot via WA");
    // Guard against undefined/null order too (dialog closed state)
    expect(storeWaDialogTitle(null)).toBe("Kirim Link Akses Chatbot via WA");
  });

  it("pesan memakai template chatbot, bukan template file digital", () => {
    renderBody(chatbotOrder);
    const msg = screen.getByTestId("store-wa-msg-preview").textContent ?? "";

    // Chatbot template markers
    expect(msg).toContain("Terima kasih sudah membeli Chatbot di Gustafta Store");
    expect(msg).toContain("Chat langsung dengan AI Chatbot Anda");
    expect(msg).toContain("https://gustafta.my.id/store/access/tok-abc123");

    // Digital template must NOT appear
    expect(msg).not.toContain("File digital Anda sudah dikirim ke email");
    expect(msg).not.toContain("langsung download di sini");
  });
});
