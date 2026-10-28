/**
 * Serves the real compiled public application, not mockup pages.
 * Deliberately does not import server/index: no database, seeds, workers or secrets.
 */
import express from "express";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const toolRoot = resolve("generated-artifacts/visual-env");
const resultDir = resolve("tests/visual/results");
const buildDir = resolve("generated-artifacts/visual-app");
const env = {
  ...process.env,
  NODE_ENV: "production",
  // CI always uses the checksum-verified binary. Nix workspaces may explicitly
  // select their compatible system Chromium, still subject to the version gate.
  CHROME_PATH: process.env.CI && process.env.CI !== "false"
    ? resolve(toolRoot, "chrome-linux64/chrome")
    : process.env.CHROME_PATH || resolve(toolRoot, "chrome-linux64/chrome"),
  FONTCONFIG_FILE: resolve(toolRoot, "fonts.conf"),
  VISUAL_EXPECTED_CHROME: "138.0.7204.100",
  TZ: "UTC",
  LANG: "en_US.UTF-8",
};
delete env.REPL_ID; // Do not include workspace-only dev plugins in CI.

function command(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("npm", args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`npm ${args.join(" ")} dihentikan oleh ${signal}`));
      else resolvePromise(code ?? 1);
    });
  });
}

async function main() {
  // Never leave a report from a previous run if setup/build fails.
  await rm(resultDir, { recursive: true, force: true });
  await mkdir(resultDir, { recursive: true });
  if (process.argv.length > 2) throw new Error("visual:ci tidak menerima --update atau argumen lain.");
  if (!existsSync(env.CHROME_PATH) || !existsSync(env.FONTCONFIG_FILE)) {
    throw new Error("Lingkungan yang dipin belum tersedia. Jalankan npm run visual:setup.");
  }
  const buildCode = await command(["exec", "--", "vite", "build", "--outDir", buildDir]);
  if (buildCode !== 0) throw new Error(`Build frontend gagal (kode ${buildCode}).`);

  const app = express();
  // Anonymous public-page captures only. Reject API requests rather than falling
  // through to SPA HTML; these captures do not claim to test backend behavior.
  app.use("/api", (_req, res) => res.status(401).json({ message: "Anonymous visual capture" }));
  app.use(express.static(buildDir));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve(buildDir, "index.html")));
  const server = await new Promise((ready, reject) => {
    const listening = app.listen(0, "127.0.0.1", () => ready(listening));
    listening.once("error", reject);
  });
  try {
    env.VISUAL_BASE_URL = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(env.VISUAL_BASE_URL);
    if (!response.ok || !(await response.text()).includes('id="root"')) {
      throw new Error("Server frontend visual belum siap.");
    }
    console.log(`Frontend aplikasi siap: ${env.VISUAL_BASE_URL}`);
    process.exitCode = await command(["run", "visual:check"]);
  } finally {
    await new Promise((done) => {
      server.close(done);
      server.closeAllConnections();
    });
  }
}

main().catch(async (error) => {
  console.error(error);
  await mkdir(resultDir, { recursive: true });
  const safeMessage = String(error.message).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  await writeFile(resolve(resultDir, "report.html"), `<!doctype html><meta charset="utf-8"><title>Pemeriksaan visual gagal</title><h1>Pemeriksaan visual gagal sebelum pembandingan</h1><pre>${safeMessage}</pre>`);
  process.exitCode = 1;
});
