import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const baselineNames = [
  "beranda-desktop", "beranda-mobile", "kontraktor-desktop", "kontraktor-mobile",
  "prose-desktop", "prose-mobile", "ring-desktop", "ring-mobile",
];
const hashes = () => baselineNames.map((name) => createHash("sha256")
  .update(readFileSync(new URL(`./visual/baselines/${name}.png`, import.meta.url))).digest("hex"));

test("every reviewed baseline is a complete PNG matching its approved content checksum", () => {
  const manifest = JSON.parse(read("tests/visual/baselines/sha256.json"));
  assert.deepEqual(Object.keys(manifest).sort(), baselineNames.map(n => `${n}.png`).sort());
  for (const [name, expected] of Object.entries(manifest)) {
    const image = readFileSync(new URL(`./visual/baselines/${name}`, import.meta.url));
    assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", name);
    assert.equal(createHash("sha256").update(image).digest("hex"), expected, name);
    assert.equal(image.subarray(-12).toString("hex"), "0000000049454e44ae426082", name);
  }
});

test("CI cannot update reviewed reference images, even without a browser", () => {
  const before = hashes();
  const result = spawnSync(process.execPath, ["scripts/check-visual.mjs", "--update"], {
    env: { ...process.env, CI: "true", CHROME_PATH: "/nonexistent/browser" },
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Pembaruan referensi dilarang dalam CI/);
  assert.deepEqual(hashes(), before);
});

test("visual CI runs automatically, compares only, and retains complete reports after failure", () => {
  const workflow = read(".github/workflows/visual.yml");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  // An actual Node runtime release, not the @types/node dependency version.
  assert.match(workflow, /node-version: "20\.20\.0"/);
  assert.match(workflow, /node --test tests\/visual-ci-lock\.test\.mjs/);
  assert.match(workflow, /node scripts\/prepare-visual-ci-lock\.mjs/);
  assert.match(workflow, /await import\('express'\)/);
  assert.match(workflow, /await import\('puppeteer-core'\)/);
  assert.match(workflow, /npm run visual:setup/);
  assert.match(workflow, /npm run visual:ci/);
  assert.match(workflow, /if: \$\{\{ always\(\) \}\}/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /tests\/visual\/results\//);
  assert.match(workflow, /tests\/visual\/baselines\//);
  assert.doesNotMatch(workflow, /visual:update|--update|secrets\./);
  const runner = read("scripts/run-visual-ci.mjs");
  assert.match(runner, /"run", "visual:check"/);
  assert.match(runner, /server\.close\(done\)/);
  assert.match(runner, /server\.closeAllConnections\(\)/);
  assert.match(runner, /VISUAL_EXPECTED_CHROME: "138\.0\.7204\.100"/);
});

test("browser and both font archives have content pins, with no system font directories", () => {
  const setup = read("scripts/setup-visual-env.sh");
  assert.match(setup, /sha256sum --check/);
  assert.match(setup, /138\.0\.7204\.100\/linux64/);
  assert.match(setup, /fonts-dejavu-core_2\.37-8_all\.deb/);
  assert.match(setup, /fonts-dejavu-mono_2\.37-8_all\.deb/);
  assert.equal((setup.match(/[a-f0-9]{64}/g) || []).length, 3);
  assert.doesNotMatch(setup, /<include|<dir>\/usr\/share\/fonts/);
  assert.match(setup, /hintslight/);
  assert.match(setup, /lcddefault/);
});

test("pre-release command rejects updates and writes an actionable report on setup failure", () => {
  const before = hashes();
  const cwd = mkdtempSync(join(tmpdir(), "visual-gate-"));
  try {
    const runner = fileURLToPath(new URL("../scripts/run-visual-ci.mjs", import.meta.url));
    for (const [args, expected] of [
      [[], /Lingkungan yang dipin belum tersedia/],
      [["--update"], /visual:ci tidak menerima --update/],
    ]) {
      const result = spawnSync(process.execPath, [runner, ...args], {
        cwd, env: { ...process.env, CI: "true" }, encoding: "utf8", timeout: 10_000,
      });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, expected);
      assert.match(readFileSync(join(cwd, "tests/visual/results/report.html"), "utf8"), expected);
    }
    assert.deepEqual(hashes(), before);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
