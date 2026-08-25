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

// ── 5. admin.tsx phone-validation guard integrity ─────────────────────────────
//
// admin.tsx allowlisted as "runtime data" because it reads the customer phone
// from the DB.  This section makes sure the E.164 guard (the regex that keeps
// emails, empty strings, and local "08xx" numbers from becoming broken wa.me
// URLs) is actually present and that every dynamic wa.me link is null-guarded
// behind that validation.

describe("admin.tsx WA phone validation guard", () => {
  const adminSrc = readSrc("pages/admin.tsx");

  // ── 5a. The strict E.164 regex must appear in the file ──────────────────

  test("contains /^62\\d{8,}$/ validation regex", () => {
    // Look for the literal regex pattern — both /^62\d{8,}$/ and the test() call
    assert.match(
      adminSrc,
      /\/\^62\\d\{8,\}\$\/\.test\(/,
      "admin.tsx must contain the /^62\\d{8,}$/ E.164 validation regex. " +
        "Removing or weakening it (e.g. to a length-only check) will break this guard.",
    );
  });

  test("E.164 validation regex appears for every WA dialog that reads a customer phone", () => {
    // There are (at minimum) two dialogs that build a per-customer wa.me link:
    // the Modul WA dialog and the Store WA dialog.  Both must independently
    // validate the phone so that neither dialog can silently produce a broken
    // link when the other dialog's guard is present.
    const occurrences = [...adminSrc.matchAll(/\/\^62\\d\{8,\}\$\/\.test\(/g)];
    assert.ok(
      occurrences.length >= 2,
      `admin.tsx must have the E.164 validation regex in ALL dialogs that build ` +
        `a customer-phone wa.me link (expected ≥2 occurrences, found ${occurrences.length}).`,
    );
  });

  // ── 5b. No bare wa.me/${phoneNum} without a null-guard ──────────────────

  test("waDirectUrl is always null-guarded before being used in wa.me URL", () => {
    // The pattern `waDirectUrl = validPhone ? \`https://wa.me/...` : null`
    // must guard every dynamic link.  Verify that every wa.me/${phoneNum}
    // literal in the file is inside a ternary that checks validPhone.
    const directLinks = [...adminSrc.matchAll(/`https:\/\/wa\.me\/\$\{phoneNum\}/g)];
    assert.ok(
      directLinks.length >= 2,
      "Expected ≥2 wa.me/${phoneNum} template literals in admin.tsx (one per dialog).",
    );

    // Each occurrence must be preceded (within the same assignment) by
    // `validPhone ?` — confirming the ternary guard is in place.
    const guardedLinks = [...adminSrc.matchAll(/validPhone\s*\?\s*`https:\/\/wa\.me\/\$\{phoneNum\}/g)];
    assert.strictEqual(
      guardedLinks.length,
      directLinks.length,
      `Every wa.me/\${phoneNum} in admin.tsx must be guarded by "validPhone ?" ` +
        `(found ${directLinks.length} links but only ${guardedLinks.length} are guarded).`,
    );
  });

  // ── 5c. Edge-case coverage: the regex rejects common bad inputs ──────────

  test("E.164 regex /^62\\d{8,}$/ rejects email-as-phone", () => {
    const re = /^62\d{8,}$/;
    assert.ok(!re.test("user@example.com"), "regex must reject email addresses");
    assert.ok(!re.test("admin@gustafta.my.id"), "regex must reject email addresses");
  });

  test("E.164 regex /^62\\d{8,}$/ rejects empty string", () => {
    const re = /^62\d{8,}$/;
    assert.ok(!re.test(""), "regex must reject empty string");
  });

  test("E.164 regex /^62\\d{8,}$/ rejects raw local format (08xx)", () => {
    // admin.tsx normalises 08xx → 628xx before testing, so the raw local
    // format should NOT pass the regex directly (normalisation is required).
    const re = /^62\d{8,}$/;
    assert.ok(!re.test("08123456789"), "regex must reject un-normalised 08xx local format");
    assert.ok(!re.test("0812345678"), "regex must reject un-normalised 0812345678");
  });

  test("E.164 regex /^62\\d{8,}$/ rejects too-short Indonesian numbers", () => {
    const re = /^62\d{8,}$/;
    assert.ok(!re.test("621234567"), "regex must reject 62 + only 7 digits (too short)");
  });

  test("E.164 regex /^62\\d{8,}$/ accepts valid Indonesian E.164 numbers", () => {
    const re = /^62\d{8,}$/;
    assert.ok(re.test("6281234567890"), "regex must accept valid 628… number");
    assert.ok(re.test("62812345678"), "regex must accept 62 + 9 digits");
    assert.ok(re.test("6281234567"), "regex must accept 62 + 8 digits (minimum)");
  });

  test("E.164 regex /^62\\d{8,}$/ rejects garbage strings", () => {
    const re = /^62\d{8,}$/;
    assert.ok(!re.test("undefined"), "regex must reject the literal string 'undefined'");
    assert.ok(!re.test("null"), "regex must reject the literal string 'null'");
    assert.ok(!re.test("garbage"), "regex must reject arbitrary garbage");
    assert.ok(!re.test("+6281234567890"), "regex must reject E.164 with leading + (not normalised)");
  });
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
  /**
   * Returns the set of expressions in `src` that are provably derived from the
   * `useContactNumbers()` hook (imported from @/lib/contact).  The hook always
   * returns `primary` / `secondary` values that fall back to the canonical
   * WA_CONTACT_NUMBER / WA_CONTACT_NUMBER_2 constants, so interpolating them
   * into a wa.me URL can never produce `undefined` / `null`.
   *
   * Recognised declaration shapes:
   *   const contact = useContactNumbers();            → contact.primary / contact.secondary
   *   const { primary, secondary } = useContactNumbers();  → primary / secondary
   *   const { secondary: waSecondary } = useContactNumbers(); → waSecondary
   */
  function contactHookSafeExprs(src: string): Set<string> {
    const safe = new Set<string>();
    // Only trust the hook when it's imported from the canonical module
    const importsHook = src
      .split("\n")
      .some(
        (l) =>
          l.trimStart().startsWith("import") &&
          l.includes("useContactNumbers") &&
          l.includes("@/lib/contact"),
      );
    if (!importsHook) return safe;

    // const <name> = useContactNumbers()
    for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*useContactNumbers\(\)/g)) {
      safe.add(`${m[1]}.primary`);
      safe.add(`${m[1]}.secondary`);
    }
    // const { primary, secondary: alias, ... } = useContactNumbers()
    // Only the phone-number keys `primary` / `secondary` are safe to interpolate
    // into a wa.me URL; any other destructured key (typo, `link`, nonexistent
    // property, …) is NOT recognised and will fail the assertion below.
    for (const m of src.matchAll(/const\s*\{([^}]+)\}\s*=\s*useContactNumbers\(\)/g)) {
      for (const part of m[1].split(",")) {
        const [key, alias] = part.split(":").map((s) => s.trim());
        if (key !== "primary" && key !== "secondary") continue;
        safe.add(alias || key);
      }
    }
    return safe;
  }

  const RUNTIME_DYNAMIC_ALLOWLIST = new Set([
    "lib/contact.ts",                          // source file itself — hook derives from its own fallback constants
    "components/panels/marketing-panel.tsx",   // template editor — wa from user input, guarded by `wa ?`
    "pages/agent-chat.tsx",                    // whatsappCta from agent config
    "pages/agent-landing.tsx",                 // num from fetched agent data
    "pages/partner-landing.tsx",               // partner.contactPhone from DB
    "components/shared-header.tsx",            // partner.contactPhone from DB (guarded); n.link from contact array
    "pages/dialog-gustafta.tsx",               // phone arg, replaced to E.164 before use
    "pages/admin.tsx",                         // admin → customer phone (validated /^62\d{8,}$/ after E.164 normalisation; toast error on invalid)
    "pages/pricing.tsx",                       // WHATSAPP_NUMBER = WA_CONTACT_NUMBER_2 (local alias)
  ]);

  test("contactHookSafeExprs recognises only primary/secondary (and their aliases)", () => {
    const hookImport = `import { useContactNumbers } from "@/lib/contact";\n`;

    // Object form: contact.primary / contact.secondary safe, nothing else
    const objSafe = contactHookSafeExprs(hookImport + `const contact = useContactNumbers();`);
    assert.ok(objSafe.has("contact.primary") && objSafe.has("contact.secondary"));
    assert.strictEqual(objSafe.size, 2);

    // Destructured aliases of primary/secondary are safe
    const aliasSafe = contactHookSafeExprs(
      hookImport + `const { secondary: waSecondary, primary } = useContactNumbers();`,
    );
    assert.ok(aliasSafe.has("waSecondary"), "alias of secondary must be recognised");
    assert.ok(aliasSafe.has("primary"), "plain primary must be recognised");
    assert.strictEqual(aliasSafe.size, 2);

    // Unknown / non-phone destructured keys must NOT be recognised
    const badSafe = contactHookSafeExprs(
      hookImport + `const { phone, link, waLink: w } = useContactNumbers();`,
    );
    assert.strictEqual(badSafe.size, 0, "unknown destructured keys must fail the guard");

    // Without the canonical import, nothing is safe
    const noImport = contactHookSafeExprs(`const contact = useContactNumbers();`);
    assert.strictEqual(noImport.size, 0, "hook without @/lib/contact import must not be trusted");
  });

  test("every RUNTIME_DYNAMIC_ALLOWLIST entry has an explanatory comment", () => {
    // No file may be allowlisted silently: each entry line inside the
    // RUNTIME_DYNAMIC_ALLOWLIST literal must carry a trailing `// why safe` comment.
    const selfSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
    const start = selfSrc.indexOf("RUNTIME_DYNAMIC_ALLOWLIST = new Set([");
    assert.ok(start !== -1, "RUNTIME_DYNAMIC_ALLOWLIST literal not found in this test file");
    const end = selfSrc.indexOf("]);", start);
    const block = selfSrc.slice(start, end);
    const entryLines = block.split("\n").filter((l) => /^\s*["']/.test(l));
    assert.ok(entryLines.length > 0, "allowlist appears empty — parsing failed?");
    for (const line of entryLines) {
      assert.match(
        line,
        /\/\/\s*\S/,
        `Allowlist entry must have a trailing comment explaining why it's safe:\n  ${line.trim()}`,
      );
    }
  });

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

      // For all other files, every ${...} inside wa.me must reference either a
      // WA_CONTACT_* export or a value provably derived from useContactNumbers()
      const hookSafe = contactHookSafeExprs(src);
      for (const [full, expr] of templateUrls) {
        const trimmed = expr.trim();
        const isFromContact =
          trimmed.startsWith("WA_CONTACT_") ||    // direct constant
          trimmed.startsWith("WA_NUMBER") ||       // local alias of a WA_CONTACT_* (e.g. checkout.tsx)
          trimmed.startsWith("WA_TRIAL_") ||       // premium-page-guard local alias
          /^WA_/.test(trimmed) ||                  // any other WA_* alias of the same constants
          hookSafe.has(trimmed);                   // useContactNumbers() value (falls back to WA_CONTACT_*)

        assert.ok(
          isFromContact,
          `${rel}: wa.me URL uses "\${${trimmed}}" — expected a WA_CONTACT_* constant from @/lib/contact ` +
            `or a value from useContactNumbers(). ` +
            `If this is intentional runtime data, add "${rel}" to RUNTIME_DYNAMIC_ALLOWLIST with a comment explaining why it's safe.`,
        );
      }
    });
  }
});
