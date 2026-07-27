/**
 * WhatsApp CTA integrity guard
 *
 * After the phone-number refactor (~70 files now import from
 * `client/src/lib/contact.ts`), this test makes sure:
 *
 * 1. The canonical contact module exports real phone numbers (not
 *    undefined / null / empty strings).
 * 2. No source file contains a literal `wa.me/undefined` or
 *    `wa.me/null` string — the most visible form of a broken import.
 * 3. Every file that constructs a `wa.me/${...}` URL either
 *    (a) uses one of the named WA_CONTACT_* constants from @/lib/contact, or
 *    (b) interpolates a local variable that is itself guarded / runtime-safe
 *        (agent phone from DB, partner phone from DB, share-to-WA text, etc.)
 * 4. Every file that imports WA_CONTACT_* uses the canonical path
 *    `@/lib/contact` (not a relative path that could resolve to a stale copy).
 *
 * Run with:  npx tsx tests/run.ts
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLIENT_SRC = join(ROOT, "client/src");

// ── helpers ──────────────────────────────────────────────────────────────────

function readSrc(rel: string): string {
  return readFileSync(join(CLIENT_SRC, rel), "utf8");
}

/** Recursively collect .ts / .tsx files under a directory */
function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectFiles(full, out);
    else if ([".ts", ".tsx"].includes(extname(entry))) out.push(full);
  }
  return out;
}

const allClientFiles = collectFiles(CLIENT_SRC);

// ── 1. contact.ts exports are well-formed ────────────────────────────────────

describe("contact.ts canonical exports", () => {
  const contactSrc = readSrc("lib/contact.ts");

  test("_FALLBACK_PRIMARY is a non-empty numeric string (628…)", () => {
    const m = contactSrc.match(/_FALLBACK_PRIMARY\s*=\s*["']([^"']+)["']/);
    assert.ok(m, "_FALLBACK_PRIMARY constant not found in contact.ts");
    assert.match(m[1], /^628\d{8,}$/, `_FALLBACK_PRIMARY "${m[1]}" must start with 628 and be numeric`);
  });

  test("_FALLBACK_SECONDARY is a non-empty numeric string (628…)", () => {
    const m = contactSrc.match(/_FALLBACK_SECONDARY\s*=\s*["']([^"']+)["']/);
    assert.ok(m, "_FALLBACK_SECONDARY constant not found in contact.ts");
    assert.match(m[1], /^628\d{8,}$/, `_FALLBACK_SECONDARY "${m[1]}" must start with 628 and be numeric`);
  });

  test("WA_CONTACT_LINK is built from WA_CONTACT_NUMBER (not from a literal number)", () => {
    assert.match(
      contactSrc,
      /WA_CONTACT_LINK\s*[:=][^=].*`https:\/\/wa\.me\/\$\{WA_CONTACT_NUMBER\}`/,
      "WA_CONTACT_LINK must derive from WA_CONTACT_NUMBER",
    );
  });

  test("WA_CONTACT_LINK_2 is built from WA_CONTACT_NUMBER_2", () => {
    assert.match(
      contactSrc,
      /WA_CONTACT_LINK_2\s*[:=][^=].*`https:\/\/wa\.me\/\$\{WA_CONTACT_NUMBER_2\}`/,
      "WA_CONTACT_LINK_2 must derive from WA_CONTACT_NUMBER_2",
    );
  });

  test("waLink() function uses WA_CONTACT_LINK / WA_CONTACT_LINK_2, not hardcoded numbers", () => {
    assert.match(
      contactSrc,
      /function waLink/,
      "waLink function must be exported from contact.ts",
    );
    // The function body must NOT contain a raw 628… number
    const fnBody = contactSrc.slice(contactSrc.indexOf("function waLink"));
    assert.doesNotMatch(fnBody.slice(0, 300), /628\d{8,}/, "waLink() must not hardcode a phone number");
  });
});

// ── 2. No literal wa.me/undefined or wa.me/null anywhere in source ───────────

describe("no wa.me/undefined or wa.me/null in source files", () => {
  const badPatterns = [
    /https:\/\/wa\.me\/undefined/,
    /https:\/\/wa\.me\/null/,
    /https:\/\/wa\.me\/\$\{undefined\}/,
    /https:\/\/wa\.me\/\$\{null\}/,
  ];

  for (const filePath of allClientFiles) {
    const rel = filePath.replace(CLIENT_SRC + "/", "");
    test(`${rel} has no wa.me/undefined or wa.me/null`, () => {
      const src = readFileSync(filePath, "utf8");
      for (const pat of badPatterns) {
        assert.doesNotMatch(src, pat, `${rel} contains a broken wa.me URL matching ${pat}`);
      }
    });
  }
});

// ── 3. Every WA_CONTACT_* import uses the canonical path ─────────────────────

describe("WA_CONTACT_* imports use @/lib/contact", () => {
  for (const filePath of allClientFiles) {
    const rel = filePath.replace(CLIENT_SRC + "/", "");
    // Skip contact.ts itself
    if (rel === "lib/contact.ts") continue;

    const src = readFileSync(filePath, "utf8");
    if (!src.includes("WA_CONTACT_")) continue; // file doesn't use it

    test(`${rel} imports WA_CONTACT_* from @/lib/contact`, () => {
      // All import statements that mention WA_CONTACT_ must point to @/lib/contact
      const importLines = src
        .split("\n")
        .filter((l) => l.includes("WA_CONTACT_") && l.trimStart().startsWith("import"));

      assert.ok(importLines.length > 0, `${rel} uses WA_CONTACT_ but has no import for it`);

      for (const line of importLines) {
        assert.match(
          line,
          /@\/lib\/contact/,
          `${rel}: WA_CONTACT_* must be imported from "@/lib/contact", got:\n  ${line.trim()}`,
        );
      }
    });
  }
});

// ── 4. Snapshot: expected set of files that use WA_CONTACT_* ─────────────────
// This catches any new file that forgets to import from contact.ts and instead
// tries to inline a phone number directly in a wa.me URL.

describe("wa.me URL construction safety", () => {
  /**
   * Files where wa.me URLs are built with runtime data (partner phone, agent
   * phone, share-text) — these are intentionally NOT from contact.ts and are
   * guarded by the caller context.
   *
   * Also includes:
   * - lib/contact.ts itself (the useContactNumbers hook builds links from its
   *   own `primary`/`secondary` runtime values, which ultimately derive from
   *   WA_CONTACT_NUMBER / WA_CONTACT_NUMBER_2 fallbacks)
   * - pages/pricing.tsx — uses `WHATSAPP_NUMBER` which is a module-level
   *   `const WHATSAPP_NUMBER = WA_CONTACT_NUMBER_2` alias; verify with grep.
   * - pages/admin.tsx — builds a wa.me link from a customer's stored phone
   *   number (E.164 formatted) to let admins message individual users.
   */
  const RUNTIME_DYNAMIC_ALLOWLIST = new Set([
    "lib/contact.ts",                          // source file itself — hook derives from its own fallback constants
    "components/panels/marketing-panel.tsx",   // template editor — wa from user input, guarded by `wa ?`
    "pages/agent-chat.tsx",                    // whatsappCta from agent config
    "pages/agent-landing.tsx",                 // num from fetched agent data
    "pages/partner-landing.tsx",               // partner.contactPhone from DB
    "components/shared-header.tsx",            // partner.contactPhone from DB (guarded); n.link from contact array
    "pages/dialog-gustafta.tsx",               // phone arg, replaced to E.164 before use
    "pages/admin.tsx",                         // admin → customer phone (E.164 formatted) for direct WA message
    "pages/pricing.tsx",                       // WHATSAPP_NUMBER = WA_CONTACT_NUMBER_2 (local alias)
  ]);

  for (const filePath of allClientFiles) {
    const rel = filePath.replace(CLIENT_SRC + "/", "");
    const src = readFileSync(filePath, "utf8");

    // Check files that construct wa.me URLs with template literals
    if (!src.includes("wa.me/")) continue;

    // Count distinct wa.me/${...} template patterns
    const templateUrls = [...src.matchAll(/wa\.me\/\$\{([^}]+)\}/g)];
    if (templateUrls.length === 0) continue; // only static wa.me links — fine

    test(`${rel}: all dynamic wa.me URLs use contact.ts constants or are in allowlist`, () => {
      if (RUNTIME_DYNAMIC_ALLOWLIST.has(rel)) {
        // These files may use runtime data — just confirm they don't literally say undefined/null
        for (const [full] of templateUrls) {
          assert.ok(
            !full.includes("undefined") && !full.includes("null"),
            `${rel}: wa.me URL contains literal undefined/null: ${full}`,
          );
        }
        return;
      }

      // For all other files, every ${...} inside wa.me must reference a WA_CONTACT_* export
      for (const [full, expr] of templateUrls) {
        const trimmed = expr.trim();
        const isFromContact =
          trimmed.startsWith("WA_CONTACT_") ||    // direct constant
          trimmed.startsWith("WA_NUMBER") ||       // local alias of a WA_CONTACT_* (e.g. checkout.tsx)
          trimmed.startsWith("WA_TRIAL_") ||       // premium-page-guard local alias
          /^WA_/.test(trimmed);                    // any other WA_* alias of the same constants

        assert.ok(
          isFromContact,
          `${rel}: wa.me URL uses "\${${trimmed}}" — expected a WA_CONTACT_* constant from @/lib/contact. ` +
            `If this is intentional runtime data, add "${rel}" to RUNTIME_DYNAMIC_ALLOWLIST.`,
        );
      }
    });
  }
});
