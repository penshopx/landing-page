import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const checker = join(projectRoot, "scripts/check-visual.mjs");
const originalBaselines = join(projectRoot, "tests/visual/baselines");
const routes = {
  "/": { heading: "Kerja konstruksi lebih terarah", classes: "" },
  "/kontraktor": { heading: "Menangkan Tender Lebih Cepat", classes: "" },
  "/documentation": { heading: "Dokumentasi Gustafta", classes: "prose" },
  "/pricing": { heading: "Anda yang Build", classes: "ring-2 ring-violet-400" },
};
const names = ["beranda", "kontraktor", "prose", "ring"]
  .flatMap((name) => ["desktop", "mobile"].map((view) => `${name}-${view}.png`));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fingerprints(dir) {
  const files = (await readdir(dir)).sort();
  return Promise.all(files.map(async (name) => [name, hash(await readFile(join(dir, name)))]));
}

function runChecker(cwd, env, args = []) {
  return new Promise((done, reject) => {
    // Async spawn: the parent must keep serving fixture HTTP while Chrome runs.
    const child = spawn(process.execPath, [checker, ...args], {
      cwd, env, stdio: ["ignore", "pipe", "pipe"], timeout: 60_000,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.once("error", reject);
    child.once("close", (code, signal) => done({ code, signal, stdout, stderr }));
  });
}

test("the real visual gate rejects repeatable card color/ring changes and writes linked diffs", { timeout: 360_000 }, async (t) => {
  const originalHashes = await fingerprints(originalBaselines);
  const artifacts = join(projectRoot, "generated-artifacts");
  await mkdir(artifacts, { recursive: true });
  // check-visual resolves ALL baseline/results paths from cwd, not its own path.
  // Even --update therefore cannot write the reviewed application references.
  const cwd = await mkdtemp(join(artifacts, "visual-negative-"));
  const visualRoot = join(cwd, "tests/visual");
  console.log(`Bukti uji negatif: ${cwd}`);
  const template = await readFile(new URL("./visual/fixtures/cards.html", import.meta.url), "utf8");
  let variant = "normal";
  const server = createServer((req, res) => {
    const route = routes[req.url];
    if (!route) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(template.replace("{{variant}}", variant)
      .replace("{{heading}}", route.heading).replace("{{classes}}", route.classes));
  });
  t.after(async () => {
    await new Promise((done) => { server.close(done); server.closeAllConnections(); });
    assert.deepEqual(await fingerprints(originalBaselines), originalHashes, "Referensi asli tidak boleh berubah");
  });
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
  const env = {
    ...process.env,
    VISUAL_BASE_URL: `http://127.0.0.1:${server.address().port}`,
  };
  // Only ephemeral fixture references are generated, never application baselines.
  const seed = await runChecker(cwd, { ...env, CI: "false" }, ["--update"]);
  assert.equal(seed.signal, null, seed.stderr);
  assert.equal(seed.code, 0, seed.stderr);
  const fixtureHashes = await fingerprints(join(visualRoot, "baselines"));
  assert.deepEqual(fixtureHashes.map(([name]) => name).sort(), [...names].sort());

  async function compare(label, changedCase) {
    const result = await runChecker(cwd, { ...env, CI: "true" });
    assert.equal(result.signal, null, result.stderr);
    assert.equal(result.code, changedCase ? 1 : 0, result.stdout + result.stderr);
    assert.equal(result.stderr, "", "Kegagalan harus berasal dari diff, bukan error browser/heading");
    const results = join(visualRoot, "results");
    const report = await readFile(join(results, "report.html"), "utf8");
    const diffHashes = [];
    for (const name of names) {
      const changed = changedCase && name.startsWith(`${changedCase}-`);
      const status = changed ? "BERUBAH" : "LULUS";
      assert.match(result.stdout, new RegExp(`${status} ${name}:`));
      const row = report.match(new RegExp(`${name} — ${status} \\(([\\d.]+)%`));
      assert.ok(row, `${name}: status harus tampil di laporan`);
      assert.ok(changed ? Number(row[1]) > 1.2 : Number(row[1]) === 0, `${name}: ambang perubahan`);
      const diffName = name.replace(".png", "-diff.png");
      // The report must display references, actual captures AND diff, with valid links.
      for (const link of [`../baselines/${name}`, name, diffName]) {
        assert.ok(report.includes(`src="${link}"`), `Tautan gambar hilang: ${link}`);
        const png = await readFile(resolve(results, link));
        assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        assert.ok(png.length > 100, `PNG kosong: ${link}`);
      }
      const actualHash = hash(await readFile(join(results, name)));
      const baselineHash = hash(await readFile(join(visualRoot, "baselines", name)));
      assert.equal(actualHash === baselineHash, !changed, `${name}: perubahan gambar aktual`);
      diffHashes.push(hash(await readFile(join(results, diffName))));
    }
    assert.deepEqual(await fingerprints(join(visualRoot, "baselines")), fixtureHashes);
    // Preserve every run without breaking report ../baselines links.
    await rename(results, join(visualRoot, `results-${label}`));
    return diffHashes;
  }

  await compare("normal");
  for (const [mutation, changedCase] of [["color", "prose"], ["ring", "ring"]]) {
    variant = mutation;
    const first = await compare(`${mutation}-1`, changedCase);
    const second = await compare(`${mutation}-2`, changedCase);
    assert.deepEqual(second, first, `Diff ${mutation} harus dapat diulang persis`);
  }
});
