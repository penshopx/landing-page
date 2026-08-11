/**
 * Task #219 — ProdUrlCard: inline validation error clears when the admin
 * corrects the URL.
 *
 * Strategy (mirrors admin-modul-wa-dialog.vitest.tsx): import the real
 * ProdUrlCard component exported from admin.tsx and drive its input.
 *
 * Contracts verified:
 * 1. Typing a .replit.dev URL → error visible (data-testid="prod-url-error"),
 *    Save button disabled.
 * 2. Correcting to a valid https://*.replit.app URL → error gone, Save enabled.
 * 3. http:// URL → error; correcting to https:// clears it.
 * 4. Malformed URL → error; correcting clears it.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

import { ProdUrlCard } from "../client/src/pages/admin";

function renderCard() {
  return render(
    <ProdUrlCard appUrl="https://gustafta.my.id" isDevUrl={false} onSaved={() => {}} />
  );
}

beforeEach(() => {
  toastSpy.mockClear();
});

describe("ProdUrlCard — error clears when the admin corrects the URL", () => {
  it(".replit.dev URL → error muncul + Simpan disabled; koreksi ke .replit.app → error hilang + Simpan enabled", () => {
    renderCard();
    const input = screen.getByTestId("input-prod-url");
    const save = screen.getByTestId("button-save-prod-url");

    // Empty input → no error, Save disabled (nothing to save)
    expect(screen.queryByTestId("prod-url-error")).toBeNull();
    expect(save).toBeDisabled();

    // Type an unstable dev URL
    fireEvent.change(input, { target: { value: "https://my-app.replit.dev" } });
    const err = screen.getByTestId("prod-url-error");
    expect(err).toHaveTextContent(".replit.dev");
    expect(save).toBeDisabled();

    // Correct it to a stable production URL
    fireEvent.change(input, { target: { value: "https://my-app.replit.app" } });
    expect(screen.queryByTestId("prod-url-error")).toBeNull();
    expect(save).toBeEnabled();
  });

  it("http:// URL → error; koreksi ke https:// → error hilang + Simpan enabled", () => {
    renderCard();
    const input = screen.getByTestId("input-prod-url");
    const save = screen.getByTestId("button-save-prod-url");

    fireEvent.change(input, { target: { value: "http://gustafta.my.id" } });
    expect(screen.getByTestId("prod-url-error")).toHaveTextContent("https://");
    expect(save).toBeDisabled();

    fireEvent.change(input, { target: { value: "https://gustafta.my.id" } });
    expect(screen.queryByTestId("prod-url-error")).toBeNull();
    expect(save).toBeEnabled();
  });

  it("URL malformed → error format; koreksi ke URL valid → error hilang + Simpan enabled", () => {
    renderCard();
    const input = screen.getByTestId("input-prod-url");
    const save = screen.getByTestId("button-save-prod-url");

    fireEvent.change(input, { target: { value: "bukan-sebuah-url" } });
    expect(screen.getByTestId("prod-url-error")).toHaveTextContent("Format URL tidak valid");
    expect(save).toBeDisabled();

    fireEvent.change(input, { target: { value: "https://nama-app.replit.app" } });
    expect(screen.queryByTestId("prod-url-error")).toBeNull();
    expect(save).toBeEnabled();
  });

  it("mengosongkan input setelah error → error hilang (tidak nyangkut)", () => {
    renderCard();
    const input = screen.getByTestId("input-prod-url");

    fireEvent.change(input, { target: { value: "https://x.replit.dev" } });
    expect(screen.getByTestId("prod-url-error")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByTestId("prod-url-error")).toBeNull();
  });
});
