import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { portableVisualLockfile } from "../scripts/prepare-visual-ci-lock.mjs";

const fixture = () => ({
  lockfileVersion: 3,
  packages: {
    "": { dependencies: { express: "^5.0.1" } },
    "node_modules/express": {
      version: "5.2.1", integrity: "sha512-fixture",
      resolved: "http://package-firewall.replit.local/npm/express/-/express-5.2.1.tgz",
      dependencies: { accepts: "^2.0.0" },
    },
    "node_modules/@scope/example": {
      version: "1.0.0", integrity: "sha512-scoped",
      resolved: "https://package-firewall.replit.local/npm/@scope/example/-/example-1.0.0.tgz",
    },
    "node_modules/public": {
      version: "2.0.0", integrity: "sha512-public",
      resolved: "https://registry.npmjs.org/public/-/public-2.0.0.tgz",
    },
  },
});

test("only the workspace registry origin changes, retaining pinned dependency metadata", () => {
  const input = fixture();
  const before = structuredClone(input);
  const { lock, rewritten } = portableVisualLockfile(input);
  assert.equal(rewritten, 2);
  assert.deepEqual(input, before, "Do not mutate the caller's lockfile");
  for (const [path, entry] of Object.entries(lock.packages)) {
    const original = before.packages[path];
    const { resolved: ignored, ...metadata } = entry;
    const { resolved: originalIgnored, ...originalMetadata } = original;
    assert.deepEqual(metadata, originalMetadata);
  }
  assert.equal(lock.packages["node_modules/express"].resolved,
    "https://registry.npmjs.org/express/-/express-5.2.1.tgz");
  assert.equal(lock.packages["node_modules/@scope/example"].resolved,
    "https://registry.npmjs.org/@scope/example/-/example-1.0.0.tgz");
  assert.deepEqual(lock.packages["node_modules/public"], before.packages["node_modules/public"]);
  assert.deepEqual(portableVisualLockfile(lock), { lock, rewritten: 0 });
});

test("unsupported formats and unsafe or unverifiable internal entries fail closed", () => {
  assert.throws(() => portableVisualLockfile({ lockfileVersion: 1 }), /v2\/v3/);
  for (const resolved of [
    "http://package-firewall.replit.local/express.tgz",
    "http://package-firewall.replit.local:8080/npm/express.tgz",
    "http://package-firewall.replit.local/npm/express.tgz?other=1",
    "ftp://package-firewall.replit.local/npm/express.tgz",
  ]) {
    const input = fixture();
    input.packages["node_modules/express"].resolved = resolved;
    assert.throws(() => portableVisualLockfile(input), /portable path or integrity/);
  }
  const input = fixture();
  delete input.packages["node_modules/express"].integrity;
  assert.throws(() => portableVisualLockfile(input), /integrity/);
});

test("CLI only changes the isolated Actions lockfile and preserves it on validation failure", () => {
  const cwd = mkdtempSync(join(tmpdir(), "visual-lock-"));
  const file = join(cwd, "package-lock.json");
  const cli = fileURLToPath(new URL("../scripts/prepare-visual-ci-lock.mjs", import.meta.url));
  const run = (actions) => spawnSync(process.execPath, [cli], {
    cwd, encoding: "utf8", env: { ...process.env, GITHUB_ACTIONS: actions }, timeout: 10_000,
  });
  try {
    const original = JSON.stringify(fixture());
    writeFileSync(file, original);
    const denied = run("false");
    assert.equal(denied.status, 1);
    assert.match(denied.stderr, /restricted to GitHub Actions/);
    assert.equal(readFileSync(file, "utf8"), original);
    const valid = run("true");
    assert.equal(valid.status, 0, valid.stderr);
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), portableVisualLockfile(fixture()).lock);
    const invalid = fixture();
    delete invalid.packages["node_modules/express"].integrity;
    const invalidBytes = JSON.stringify(invalid);
    writeFileSync(file, invalidBytes);
    assert.equal(run("true").status, 1);
    assert.equal(readFileSync(file, "utf8"), invalidBytes);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
