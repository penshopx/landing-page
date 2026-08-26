import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createServer } from "node:http";
import {
  registerSbuSkkStaticLanding,
  SBU_SKK_STATIC_LANDING_PATH,
} from "../server/sbu-skk-static-landing";
import { SBU_SKK_EBOOK } from "../shared/sbu-skk-ebook";

async function getLanding() {
  const app = express();
  registerSbuSkkStaticLanding(app);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    return await fetch(`http://127.0.0.1:${address.port}${SBU_SKK_STATIC_LANDING_PATH}`);
  } finally {
    server.close();
  }
}

test("landing statis Level 1 terkirim sebagai HTML cacheable tanpa bundle React", async () => {
  const response = await getLanding();
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/html/);
  assert.match(response.headers.get("cache-control") || "", /public/);
  assert.ok(Buffer.byteLength(html) < 35_000, "HTML landing harus tetap di bawah 35 KB");
  assert.doesNotMatch(html, /\/assets\/index-[^"']+\.js/);
  assert.doesNotMatch(html, /vite|react|SharedHeader|widget\/loader/i);
});

test("landing memakai penawaran kanonik dan checkout Scalev Level 1", async () => {
  const response = await getLanding();
  const html = await response.text();

  assert.match(html, new RegExp(SBU_SKK_EBOOK.priceLabel.replace(".", "\\.")));
  assert.match(html, new RegExp(`variant_ids=${SBU_SKK_EBOOK.scalev.variantId}`));
  assert.match(html, new RegExp(`${SBU_SKK_EBOOK.pages} halaman`));
  assert.match(html, new RegExp(`${SBU_SKK_EBOOK.toolkitPages} halaman`));
  assert.match(html, /Pilih SBU/);
  assert.match(html, /atau<\/span> SKK/);
});

test("landing mencatat PageView, ViewContent, dan InitiateCheckout tanpa Purchase browser", async () => {
  const response = await getLanding();
  const html = await response.text();

  assert.match(html, /fbq\("track","PageView"\)/);
  assert.match(html, /pixel\("ViewContent",viewId\)/);
  assert.match(html, /relay\("ViewContent",viewId\)/);
  assert.match(html, /pixel\("InitiateCheckout",eventId\)/);
  assert.match(html, /relay\("InitiateCheckout",eventId\)/);
  assert.doesNotMatch(html, /fbq\("track","Purchase"/);
});