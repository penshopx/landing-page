import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findProjectSecretMatches } from "../scripts/check-project-secrets.mjs";

test("all provider prefixes and literal assignments are still blocked without exposing values", () => {
  const values = [
    "xkeysib-" + "A".repeat(30), "sk-" + "B".repeat(30), "sk_" + "C".repeat(30),
    "Bearer " + "D".repeat(30),
    'GEMINI_API_KEY = "' + "E".repeat(30) + '"',
    "FONNTE_API_KEY = '" + "F".repeat(12) + "'",
    'NOTIFY_WEBHOOK_KEY = "' + "G".repeat(30) + '"',
  ];
  for (const value of values) {
    const findings = findProjectSecretMatches(value, "example.ts");
    assert.ok(findings.length > 0);
    assert.deepEqual(Object.keys(findings[0]).sort(), ["line", "path", "rule"]);
    assert.ok(!JSON.stringify(findings).includes(value));
  }
  assert.ok(findProjectSecretMatches('GEMINI_API_KEY=' + "H".repeat(30), ".env").length);
  assert.ok(findProjectSecretMatches('FONNTE_API_KEY=' + "I".repeat(12), ".env").length);
});

test("ordinary identifiers, URL slugs, environment references and documentation are not credentials", () => {
  const lines = [
    "task_description: string", "task_context_metadata: json",
    "https://example.test/ask-construction-professional",
    "/demo/draft-sk-direktur-lsp-tim-pusat-komite",
    "const GEMINI_API_KEY = process.env.GEMINI_API_KEY;",
    "const BREVO_API_KEY = process.env.BREVO_API_KEY || '';",
    "Use [userenv.shared] only for non-sensitive configuration.",
  ];
  assert.deepEqual(findProjectSecretMatches(lines.join("\n"), "replit.md"), []);
  assert.deepEqual(findProjectSecretMatches(lines.join("\n"), "server/example.ts"), []);
});

test("the real shared config section and credential-bearing webhook URLs stay blocked", () => {
  assert.ok(findProjectSecretMatches("[userenv.shared]", ".replit").length);
  assert.deepEqual(findProjectSecretMatches("[userenv.shared]", "guide.md"), []);
  const url = 'NOTIFICATION_WEBHOOK_URL = "https://example.test/notify?key=' + "J".repeat(32) + '"';
  assert.ok(findProjectSecretMatches(url, ".replit").some(x => x.rule === "webhook-credential-in-url"));
});

test("CLI fails for a real finding and logs only location and rule, never the matched value", () => {
  const cwd = mkdtempSync(join(tmpdir(), "project-scan-"));
  const cli = fileURLToPath(new URL("../scripts/check-project-secrets.mjs", import.meta.url));
  const value = "sk-" + "Z".repeat(40);
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd }).status, 0);
    writeFileSync(join(cwd, "example.ts"), `const value = "${value}";\n`);
    const result = spawnSync(process.execPath, [cli], { cwd, encoding: "utf8", timeout: 10_000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /file=example\.ts,line=1/);
    assert.match(result.stderr, /provider-key/);
    assert.ok(!`${result.stdout}${result.stderr}`.includes(value));
    writeFileSync(join(cwd, "example.ts"), "const GEMINI_API_KEY = process.env.GEMINI_API_KEY;\n");
    assert.equal(spawnSync(process.execPath, [cli], { cwd, encoding: "utf8" }).status, 0);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
