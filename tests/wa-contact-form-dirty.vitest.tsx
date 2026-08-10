/**
 * Task #198 — the WA contact form must NOT wipe an admin's in-progress edits
 * when the contact cache refreshes in the background.
 *
 * Exercises the real useWaContactForm hook from admin.tsx:
 * 1. Pre-fills from contact values while pristine (including later updates).
 * 2. Once an input is edited (dirty), a background contact update does not
 *    overwrite the form.
 * 3. After markSaved() the dirty flag clears, so the next contact update
 *    re-syncs the form normally.
 */

import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { useWaContactForm } from "../client/src/pages/admin";

function Probe({ contact }: { contact: { primary: string; secondary: string } }) {
  const { form, setField, markSaved } = useWaContactForm(contact);
  return (
    <div>
      <input
        data-testid="input-wa-primary"
        value={form.primary}
        onChange={(e) => setField("primary", e.target.value)}
      />
      <input
        data-testid="input-wa-secondary"
        value={form.secondary}
        onChange={(e) => setField("secondary", e.target.value)}
      />
      <button
        data-testid="button-mark-saved"
        onClick={() => markSaved({ primary: form.primary, secondary: form.secondary })}
      >
        saved
      </button>
    </div>
  );
}

afterEach(cleanup);

const A = { primary: "6281111111111", secondary: "6282222222222" };
const B = { primary: "6283333333333", secondary: "6284444444444" };
const C = { primary: "6285555555555", secondary: "6286666666666" };

describe("useWaContactForm dirty-flag protection", () => {
  it("pre-fills while pristine, including background updates", () => {
    const { rerender } = render(<Probe contact={A} />);
    expect(screen.getByTestId("input-wa-primary")).toHaveValue(A.primary);
    expect(screen.getByTestId("input-wa-secondary")).toHaveValue(A.secondary);

    // Background refetch while pristine → form re-syncs
    rerender(<Probe contact={B} />);
    expect(screen.getByTestId("input-wa-primary")).toHaveValue(B.primary);
    expect(screen.getByTestId("input-wa-secondary")).toHaveValue(B.secondary);
  });

  it("does not overwrite in-progress edits when contact updates in background", () => {
    const { rerender } = render(<Probe contact={A} />);

    // Admin starts editing
    fireEvent.change(screen.getByTestId("input-wa-primary"), {
      target: { value: "628999" },
    });
    expect(screen.getByTestId("input-wa-primary")).toHaveValue("628999");

    // Background cache refresh arrives mid-edit → must NOT wipe the edits
    rerender(<Probe contact={B} />);
    expect(screen.getByTestId("input-wa-primary")).toHaveValue("628999");
    expect(screen.getByTestId("input-wa-secondary")).toHaveValue(A.secondary);
  });

  it("re-syncs from the next contact update after a successful save", () => {
    const { rerender } = render(<Probe contact={A} />);

    fireEvent.change(screen.getByTestId("input-wa-primary"), {
      target: { value: "6289998887777" },
    });

    // Save succeeds → dirty flag cleared
    fireEvent.click(screen.getByTestId("button-mark-saved"));
    expect(screen.getByTestId("input-wa-primary")).toHaveValue("6289998887777");

    // Next cache update (e.g. invalidation re-resolves) re-syncs normally
    rerender(<Probe contact={C} />);
    expect(screen.getByTestId("input-wa-primary")).toHaveValue(C.primary);
    expect(screen.getByTestId("input-wa-secondary")).toHaveValue(C.secondary);
  });
});
