import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { copyFile, mkdir, rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "p-limit",
  "mammoth",
  "passport",
  "passport-local",
  "pdf-parse",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  // Private fulfillment asset: included in the server deployment bundle but
  // deliberately kept outside dist/public so Express can never serve it
  // without the paid-order token gate.
  await mkdir("dist/private-assets", { recursive: true });
  await copyFile(
    "attached_assets/Ebook_SBU-SKK-ok_1787368451833.pdf",
    "dist/private-assets/sbu-skk-tanpa-bingung-v2.0.0.pdf",
  );
  await copyFile(
    "attached_assets/LAMPIRAN_EBOOK_1787369070797.pdf",
    "dist/private-assets/sbu-skk-lampiran-toolkit-v1.0.0.pdf",
  );
  await copyFile(
    "attached_assets/mini-ebook_SBU_1787369141323.pdf",
    "dist/private-assets/mini-ebook-sbu-skk-v1.0.0.pdf",
  );

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
      "import.meta.url": "__filename",
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
