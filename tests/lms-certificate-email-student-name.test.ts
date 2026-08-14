/**
 * Unit tests — the congratulations-email (and verify-page) studentName
 * resolution, extracted into `resolveStudentName` in server/routes-lms.ts.
 *
 * The critical regression this guards: a WA-only student (email present but
 * blank first/last name, no display_name, empty email prefix) must be greeted
 * by their MASKED PHONE — not "Peserta".
 *
 * Fallback ordering asserted:
 *   first_name+last_name → display_name → email prefix → masked phone → "Peserta"
 *
 * Also covers maskPhone edge cases (short phone, non-digit characters).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { maskPhone, resolveStudentName } from "../server/routes-lms";

// ── maskPhone edge cases ──────────────────────────────────────────────────────

test("maskPhone: masks a normal Indonesian number (keep 4 + 3)", () => {
  assert.equal(maskPhone("6281234567890"), "6281****890");
});

test("maskPhone: strips non-digit characters before masking", () => {
  assert.equal(maskPhone("+62 812-3456-7890"), "6281****890");
});

test("maskPhone: exactly 8 digits still masks", () => {
  assert.equal(maskPhone("12345678"), "1234****678");
});

test("maskPhone: fewer than 8 digits returns empty string", () => {
  assert.equal(maskPhone("1234567"), "");
  assert.equal(maskPhone("081"), "");
});

test("maskPhone: null/undefined/empty/non-digit-only return empty string", () => {
  assert.equal(maskPhone(null), "");
  assert.equal(maskPhone(undefined), "");
  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone("abc-def"), "");
});

// ── resolveStudentName fallback ordering ─────────────────────────────────────

test("full name wins over everything", () => {
  assert.equal(
    resolveStudentName({
      first_name: "Budi",
      last_name: "Santoso",
      display_name: "BudiS",
      email: "budi@example.com",
      phone: "6281234567890",
    }),
    "Budi Santoso",
  );
});

test("first_name alone is used when last_name is blank", () => {
  assert.equal(
    resolveStudentName({ first_name: "Budi", last_name: "", email: "x@y.com" }),
    "Budi",
  );
});

test("display_name used when name fields are blank", () => {
  assert.equal(
    resolveStudentName({
      first_name: "",
      last_name: null,
      display_name: "BudiS",
      email: "budi@example.com",
      phone: "6281234567890",
    }),
    "BudiS",
  );
});

test("email prefix used when name and display_name are blank", () => {
  assert.equal(
    resolveStudentName({
      first_name: "",
      display_name: "",
      email: "budi.s@example.com",
      phone: "6281234567890",
    }),
    "budi.s",
  );
});

test("WA-only student: empty email prefix falls back to MASKED PHONE, not 'Peserta'", () => {
  // WhatsApp-registered users can have a synthetic email like "@wa.local"
  // (empty prefix) with only a phone number on record.
  assert.equal(
    resolveStudentName({
      first_name: "",
      last_name: "",
      display_name: "",
      email: "@wa.local",
      phone: "6281234567890",
    }),
    "6281****890",
  );
});

test("no email at all + phone → masked phone", () => {
  assert.equal(
    resolveStudentName({ phone: "+62 812-3456-7890" }),
    "6281****890",
  );
});

test("phone too short to mask → 'Peserta'", () => {
  assert.equal(
    resolveStudentName({ email: "@wa.local", phone: "0812" }),
    "Peserta",
  );
});

test("nothing at all → 'Peserta'", () => {
  assert.equal(resolveStudentName({}), "Peserta");
  assert.equal(resolveStudentName(undefined), "Peserta");
  assert.equal(resolveStudentName(null), "Peserta");
});
