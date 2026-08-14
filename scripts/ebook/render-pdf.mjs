// Render an ebook HTML file to PDF via system chromium + puppeteer-core.
// Usage: node scripts/ebook/render-pdf.mjs <input.html> <output.pdf> [password]
import puppeteer from "puppeteer-core";
import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const [input, output, password] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node render-pdf.mjs <input.html> <output.pdf> [password]");
  process.exit(1);
}

const chromium = execSync("which chromium").toString().trim();
const browser = await puppeteer.launch({
  executablePath: chromium,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.goto("file://" + path.resolve(input), { waitUntil: "networkidle0" });
await page.pdf({
  path: password ? output + ".plain.pdf" : output,
  width: "148mm",
  height: "210mm",
  printBackground: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
await browser.close();

if (password) {
  execFileSync("qpdf", ["--encrypt", password, password, "256", "--", output + ".plain.pdf", output]);
  fs.unlinkSync(output + ".plain.pdf");
  console.log("PDF encrypted with password:", output);
} else {
  console.log("PDF written:", output);
}
