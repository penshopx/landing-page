import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "client/src/pages/lms-certificates.tsx");

test("copy-verify button handles clipboard rejection and gives feedback", () => {
  const source = readFileSync(SRC, "utf8");

  const buttonIdx = source.indexOf("button-copy-verify-");
  assert.ok(buttonIdx !== -1, "copy-verify button must exist");

  // Look at the surrounding onClick handler block
  const start = Math.max(0, buttonIdx - 1500);
  const block = source.slice(start, buttonIdx + 200);

  assert.match(block, /navigator\.clipboard\.writeText/, "handler must call clipboard.writeText");
  assert.ok(
    /try\s*\{[\s\S]*writeText[\s\S]*\}\s*catch/.test(block) || /writeText\([\s\S]*?\)[\s\S]*?\.catch\(/.test(block),
    "writeText must be wrapped in try/catch or have a .catch handler"
  );
  assert.match(block, /URL disalin/, "success toast 'URL disalin!' must be shown on resolve");
  assert.match(block, /catch[\s\S]*?toast\(/, "catch branch must show error feedback via toast");
});
