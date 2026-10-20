/**
 * Public-page visual regression gate. No login, database fixtures or remote assets.
 * Run against a local dev server; --update is an explicit baseline approval step.
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const root = resolve("tests/visual");
const baselineDir = join(root, "baselines");
const resultDir = join(root, "results");
const update = process.argv.includes("--update");
const baseUrl = process.env.VISUAL_BASE_URL || "http://127.0.0.1:5000";
const views = [
  { name: "desktop", width: 1280, height: 800, isMobile: false },
  { name: "mobile", width: 390, height: 844, isMobile: true },
];
const cases = [
  { name: "beranda", path: "/", heading: /Kerja konstruksi\s*lebih terarah/i, anchor: "h1" },
  { name: "kontraktor", path: "/kontraktor", heading: /Menangkan Tender Lebih Cepat/i, anchor: "h1" },
  { name: "prose", path: "/documentation", heading: /Dokumentasi Gustafta/, anchor: "#hierarchy .prose", element: true },
  { name: "ring", path: "/pricing", heading: /Anda yang Build/, anchor: ".ring-2.ring-violet-400", element: true },
];
const MAX_CHANGED_FRACTION = 0.012;
const CHANNEL_TOLERANCE = 20; // antialiasing / small raster differences

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

async function compareImages(page, reference, actual) {
  return page.evaluate(async (a, b, tolerance) => {
    const load = async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    };
    const [oldImage, newImage] = await Promise.all([load(a), load(b)]);
    const size = oldImage.width !== newImage.width || oldImage.height !== newImage.height
      ? `${oldImage.width}x${oldImage.height} → ${newImage.width}x${newImage.height}`
      : null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(oldImage.width, newImage.width);
    canvas.height = Math.max(oldImage.height, newImage.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(oldImage, 0, 0);
    const oldPixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(newImage, 0, 0);
    const newPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let changed = 0;
    for (let i = 0; i < oldPixels.length; i += 4) {
      const delta = Math.max(...[0, 1, 2, 3].map((j) => Math.abs(oldPixels[i + j] - newPixels.data[i + j])));
      if (delta > tolerance) {
        changed++;
        newPixels.data[i] = 255;
        newPixels.data[i + 1] = 0;
        newPixels.data[i + 2] = 180;
        newPixels.data[i + 3] = 255;
      } else {
        for (let j = 0; j < 3; j++) newPixels.data[i + j] = Math.round(oldPixels[i + j] * 0.28 + 185);
        newPixels.data[i + 3] = 255;
      }
    }
    ctx.putImageData(newPixels, 0, 0);
    return { fraction: size ? 1 : changed / (canvas.width * canvas.height), diff: canvas.toDataURL("image/png").split(",")[1], size };
  }, `data:image/png;base64,${reference.toString("base64")}`, `data:image/png;base64,${actual.toString("base64")}`, CHANNEL_TOLERANCE);
}

async function main() {
  if (update && process.env.CI && process.env.CI !== "false") {
    throw new Error("Pembaruan referensi dilarang dalam CI. Lakukan manual dan tinjau perubahan PNG.");
  }
  if (!update) {
    await rm(resultDir, { recursive: true, force: true });
    await mkdir(resultDir, { recursive: true });
  }
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || execFileSync("which", ["chromium"], { encoding: "utf8" }).trim(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const captures = [];
  try {
    const version = await browser.version();
    if (process.env.VISUAL_EXPECTED_CHROME && !version.endsWith(`/${process.env.VISUAL_EXPECTED_CHROME}`)) {
      throw new Error(`Versi Chromium tidak cocok: ${version}; wajib ${process.env.VISUAL_EXPECTED_CHROME}.`);
    }
    console.log(`Browser visual: ${version}`);
    // Isolated context guarantees no signed-in or personalized content is captured.
    const context = await browser.createBrowserContext();
    for (const view of views) {
      for (const item of cases) {
        const page = await context.newPage();
        try {
          await page.setViewport({ ...view, deviceScaleFactor: 1 });
          await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }]);
          await page.setRequestInterception(true);
          page.on("request", (request) => {
            // External fonts, embeds, trackers and remote images introduce non-repeatable pixels.
            const url = new URL(request.url());
            if (url.protocol === "http:" || url.protocol === "https:") {
              if (url.origin !== new URL(baseUrl).origin) return request.abort();
            }
            return request.continue();
          });
          const response = await page.goto(new URL(item.path, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30_000 });
          // Chromium can return null for a same-document SPA navigation. The
          // required visible anchor/heading below still rejects blank pages.
          if ((response && !response.ok()) || new URL(page.url()).pathname !== item.path) throw new Error(`${item.name}: halaman tidak tersedia / dialihkan (HTTP ${response?.status() ?? "kosong"}, path ${new URL(page.url()).pathname})`);
          await page.waitForFunction((selector) => !!document.querySelector(selector) && !!document.querySelector("h1"), { timeout: 20_000 }, item.anchor);
          const heading = await page.$eval("h1", (el) => el.textContent?.trim() || "");
          if (!item.heading.test(heading)) throw new Error(`${item.name}: heading tidak sesuai (${heading})`);
          await page.addStyleTag({ content: `
            *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
            iframe, video, [role="dialog"], [data-replit],
            div.fixed.bottom-6, a[data-testid^="link-topbar-wa-"] { visibility: hidden !important; }
            ${item.element ? "div.sticky.top-0.z-50 { position: static !important; }" : ""}
          ` });
          await page.evaluate(() => document.fonts.ready);
          // Wait for layout to settle, without waiting on dynamic API calls.
          await new Promise((r) => setTimeout(r, 400));
          const name = `${item.name}-${view.name}.png`;
          // Screenshot clip uses document coordinates, not the scroll position.
          // ElementHandle.screenshot can crop the wrong area on long mobile pages.
          const clip = item.element ? await page.$eval(item.anchor, (el) => {
            const r = el.getBoundingClientRect();
            return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
          }) : undefined;
          const image = Buffer.from(item.element
            ? await page.screenshot({ type: "png", clip, captureBeyondViewport: true })
            : await page.screenshot({ type: "png" }));
          captures.push({ name, image });
          if (!update) await writeFile(join(resultDir, name), image);
          console.log(`Tertangkap: ${name}`);
        } finally {
          await page.close();
        }
      }
    }
    await context.close();
    if (update) {
      await mkdir(baselineDir, { recursive: true });
      for (const { name, image } of captures) await writeFile(join(baselineDir, name), image);
      console.log(`Referensi diperbarui: ${captures.length} gambar. Tinjau diff git sebelum commit.`);
      return;
    }

    await mkdir(resultDir, { recursive: true });
    const comparisonPage = await browser.newPage();
    const results = [];
    for (const { name, image } of captures) {
      const baseline = join(baselineDir, name);
      if (!existsSync(baseline)) throw new Error(`Referensi ${name} belum ada. Jalankan npm run visual:update dan tinjau hasilnya.`);
      const comparison = await compareImages(comparisonPage, await readFile(baseline), image);
      await writeFile(join(resultDir, name), image);
      if (comparison.diff) await writeFile(join(resultDir, name.replace(".png", "-diff.png")), Buffer.from(comparison.diff, "base64"));
      results.push({ name, ...comparison, passed: comparison.fraction <= MAX_CHANGED_FRACTION });
    }
    await comparisonPage.close();
    const rows = results.map((r) => `<section><h2>${escapeHtml(r.name)} — ${r.passed ? "LULUS" : "BERUBAH"} (${(r.fraction * 100).toFixed(2)}%${r.size ? `; ${escapeHtml(r.size)}` : ""})</h2><div class="grid"><figure><img src="../baselines/${r.name}"><figcaption>Referensi</figcaption></figure><figure><img src="${r.name}"><figcaption>Saat ini</figcaption></figure>${r.diff ? `<figure><img src="${r.name.replace(".png", "-diff.png")}"><figcaption>Selisih (magenta)</figcaption></figure>` : ""}</div></section>`).join("\n");
    await writeFile(join(resultDir, "report.html"), `<!doctype html><html lang="id"><meta charset="utf-8"><title>Perbandingan visual</title><style>body{font:16px sans-serif;background:#111827;color:white;padding:20px}section{border-top:1px solid #64748b;padding:20px 0}.grid{display:flex;gap:12px;overflow:auto}figure{margin:0;flex:0 0 32%;min-width:230px}img{width:100%;border:1px solid #64748b}figcaption{padding:8px}</style><h1>Perbandingan visual</h1><p>Ambang: ${(MAX_CHANGED_FRACTION * 100).toFixed(1)}% piksel, toleransi per kanal ${CHANNEL_TOLERANCE}. Gambar selisih menandai perubahan dengan magenta.</p>${rows}</html>`);
    for (const r of results) console.log(`${r.passed ? "LULUS" : "BERUBAH"} ${r.name}: ${(r.fraction * 100).toFixed(2)}%`);
    console.log("Laporan: tests/visual/results/report.html");
    if (results.some((r) => !r.passed)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(async (error) => {
  console.error(`Pemeriksaan visual gagal: ${error.message}`);
  // Also provide an artifact for missing headings/browser errors, not only diffs.
  if (!update) {
    try {
      await mkdir(resultDir, { recursive: true });
      await writeFile(join(resultDir, "report.html"), `<!doctype html><meta charset="utf-8"><title>Pemeriksaan visual gagal</title><h1>Pemeriksaan visual gagal</h1><pre>${escapeHtml(error.message)}</pre>`);
    } catch (reportError) {
      console.error(`Tidak dapat menulis laporan: ${reportError.message}`);
    }
  }
  process.exitCode = 1;
});