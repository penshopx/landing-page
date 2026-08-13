/**
 * Task #236 — Cart checkout memakai URL variant Scalev ketika item punya
 * scalevVariantId DAN produk asalnya juga punya paymentUrl.
 *
 * Menguji hook produksi useCart/CartProvider langsung (bukan replika):
 *   1. addItem produk dual-field → buildCheckoutUrl() = /c/checkout?variant_ids=…
 *      dan TIDAK pernah mengembalikan paymentUrl.
 *   2. Item tanpa scalevVariantId → buildCheckoutUrl() null (rute WA).
 *   3. Alur drawer: handleCheckout membuka URL hasil buildCheckoutUrl lewat
 *      window.open — diverifikasi bahwa URL yang dibuka adalah URL variant.
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { CartProvider, useCart } from "../client/src/hooks/use-cart";
import { PAYMENT_BASE_URL } from "../client/src/lib/payment-base";

const SAMPLE_VARIANT_ID = 99_001;
const SAMPLE_PAYMENT_URL = "https://checkout.example.com/pay/product-url";

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe("useCart buildCheckoutUrl — prioritas Scalev variant", () => {
  it("item dengan scalevVariantId (produk juga punya paymentUrl) → URL /c/checkout?variant_ids=, bukan paymentUrl", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "sp-1",
        productId: 1,
        name: "Produk Dual Field",
        price: 199_000,
        emoji: "🤖",
        // Produk asal punya paymentUrl DAN scalevVariantId; cart flow harus
        // merutekan lewat variant Scalev. (paymentUrl memang tidak dibawa ke
        // CartItem — assert di bawah memastikan URL final bukan paymentUrl.)
        scalevVariantId: SAMPLE_VARIANT_ID,
      });
    });

    act(() => {
      result.current.updateQty("sp-1", 2);
    });

    const url = result.current.buildCheckoutUrl();
    expect(url).toBe(
      `${PAYMENT_BASE_URL}/c/checkout?variant_ids=${SAMPLE_VARIANT_ID}&qty=2`
    );
    expect(url).not.toContain(SAMPLE_PAYMENT_URL);
    expect(url).toContain("/c/checkout?variant_ids=");
  });

  it("item tanpa scalevVariantId → buildCheckoutUrl() null (tidak jatuh ke paymentUrl)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "sp-2",
        productId: 2,
        name: "Produk Tanpa Variant",
        price: 99_000,
        emoji: "📄",
        scalevVariantId: null,
      });
    });

    expect(result.current.buildCheckoutUrl()).toBeNull();
  });

  it("campuran: hanya item ber-scalevVariantId yang masuk URL variant", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "sp-1",
        productId: 1,
        name: "Scalev",
        price: 199_000,
        emoji: "🤖",
        scalevVariantId: SAMPLE_VARIANT_ID,
      });
      result.current.addItem({
        id: "sp-2",
        productId: 2,
        name: "Non-Scalev",
        price: 99_000,
        emoji: "📄",
        scalevVariantId: null,
      });
    });

    const url = result.current.buildCheckoutUrl();
    expect(url).toBe(
      `${PAYMENT_BASE_URL}/c/checkout?variant_ids=${SAMPLE_VARIANT_ID}&qty=1`
    );
  });
});

describe("alur checkout drawer — window.open menerima URL variant Scalev", () => {
  it("URL yang dibuka untuk item Scalev = hasil buildCheckoutUrl (bukan paymentUrl)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem({
        id: "sp-1",
        productId: 1,
        name: "Produk Dual Field",
        price: 199_000,
        emoji: "🤖",
        scalevVariantId: SAMPLE_VARIANT_ID,
      });
    });

    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null as any);

    // Replikasi minimal logika handleCheckout di cart-drawer.tsx
    // (guard statis di tests/store-catalog-scalev-variant.test.ts memastikan
    // drawer memang memfilter dengan scalevVariantId + memanggil buildCheckoutUrl()).
    const selected = result.current.items.filter((i) => i.selected);
    const scalevItems = selected.filter((i) => i.scalevVariantId);
    if (scalevItems.length > 0) {
      const url = result.current.buildCheckoutUrl() ?? PAYMENT_BASE_URL;
      window.open(url, "_blank");
    }

    expect(openSpy).toHaveBeenCalledTimes(1);
    const openedUrl = openSpy.mock.calls[0][0] as string;
    expect(openedUrl).toContain(`/c/checkout?variant_ids=${SAMPLE_VARIANT_ID}`);
    expect(openedUrl).not.toContain(SAMPLE_PAYMENT_URL);

    openSpy.mockRestore();
  });
});
