import { readFile, writeFile, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// GitHub-hosted runners cannot resolve Replit's workspace-only registry.
// Keep every locked version and integrity value; change only that origin.
export function portableVisualLockfile(input) {
  if (![2, 3].includes(input?.lockfileVersion) || !input.packages) {
    throw new Error("Expected an npm v2/v3 lockfile with packages.");
  }
  const lock = structuredClone(input);
  let rewritten = 0;
  for (const entry of Object.values(lock.packages)) {
    if (typeof entry.resolved !== "string") continue;
    const url = new URL(entry.resolved);
    if (url.hostname !== "package-firewall.replit.local") continue;
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password
        || url.port || url.search || url.hash || !url.pathname.startsWith("/npm/")
        || url.pathname.length <= 5 || !entry.integrity) {
      throw new Error("Internal registry entry lacks a portable path or integrity.");
    }
    entry.resolved = `https://registry.npmjs.org/${url.pathname.slice(5)}`;
    rewritten++;
  }
  return { lock, rewritten };
}

async function main() {
  if (process.env.GITHUB_ACTIONS !== "true") {
    throw new Error("Lockfile preparation is restricted to GitHub Actions.");
  }
  const file = resolve("package-lock.json");
  const original = await readFile(file, "utf8");
  const { lock, rewritten } = portableVisualLockfile(JSON.parse(original));
  const temporary = `${file}.visual-${process.pid}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(lock, null, 2)}\n`, { flag: "wx" });
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log(`Prepared ${rewritten} internal registry URLs; versions and integrity unchanged.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
