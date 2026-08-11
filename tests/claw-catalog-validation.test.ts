// Build-time validation of the Claw catalog (server/claw-catalog.ts).
//
// Catches, BEFORE seeding ever runs:
//   1. Duplicate product slugs (would silently reconcile the wrong agent).
//   2. Duplicate tool slugs — globally, across all products, INCLUDING the
//      auto-generated evaluator slugs (`<product-slug>-evaluator`, see
//      buildEvaluatorDef in server/lib/claw-factory.ts) and any collision
//      with product slugs themselves (tool & product agents share one
//      slug namespace in storage.getAgentBySlug).
//   3. Mispriced entries — pricing convention is licenseClass 2 /
//      licensePrice 2_500_000 / monthlyPrice 199_000 for OpenClaw and
//      licenseClass 3 / 5_000_000 / 299_000 for MultiClaw. Intentional
//      exceptions must be listed in PRICE_EXCEPTIONS below.
//   4. Missing/empty required fields (tools, evaluatorCriteria of exactly 4,
//      structure, interviewTopics, mission, docLabel, name, avatar, category).
//
// Pure in-memory test: imports the catalog data only, never touches the DB.
// Run: npx tsx --test tests/claw-catalog-validation.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";

import { CLAW_CATALOG } from "../server/claw-catalog";
import {
  buildEvaluatorDef,
  type ClawDef,
  type MultiClawDef,
} from "../server/lib/claw-factory";

// Slugs of the 4 legacy products that live in their old seed files (see the
// header comment in server/claw-catalog.ts) — the catalog must never reuse them.
const LEGACY_PRODUCT_SLUGS = [
  "desain-proyek-claw",
  "rencana-proyek-claw",
  "studi-kelayakan-claw",
  "persiapan-proyek-multiclaw",
];

// Tool/evaluator agent slugs owned by those legacy seed files. They share the
// same storage.getAgentBySlug namespace, so catalog tools and generated
// evaluator slugs must never collide with them either.
const LEGACY_TOOL_SLUGS = [
  // seed-desain-proyek-claw.ts
  "dp-drafter", "dp-regulasi", "dp-evaluator",
  // seed-rencana-proyek-claw.ts
  "rp-jadwal", "rp-sumberdaya", "rp-evaluator",
  // seed-studi-kelayakan-claw.ts
  "sk-teknis", "sk-ekonomi", "sk-evaluator",
];

const LEGACY_AGENT_SLUGS = [...LEGACY_PRODUCT_SLUGS, ...LEGACY_TOOL_SLUGS];

// Intentional pricing exceptions: slug → expected pricing. Document here when
// a product deliberately deviates from the standard convention.
const PRICE_EXCEPTIONS: Record<
  string,
  { licenseClass: number; licensePrice: number; monthlyPrice: number }
> = {};

const openclaws = CLAW_CATALOG.filter((c): c is ClawDef => c.kind === "openclaw");
const multiclaws = CLAW_CATALOG.filter((c): c is MultiClawDef => c.kind === "multiclaw");

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dups.add(v);
    seen.add(v);
  }
  return [...dups];
}

test("catalog is non-empty and every entry has a known kind", () => {
  assert.ok(CLAW_CATALOG.length > 0, "CLAW_CATALOG must not be empty");
  assert.equal(
    openclaws.length + multiclaws.length,
    CLAW_CATALOG.length,
    "every entry must be kind 'openclaw' or 'multiclaw'"
  );
});

test("product slugs are unique", () => {
  const slugs = CLAW_CATALOG.map((c) => c.slug);
  assert.deepEqual(findDuplicates(slugs), [], "duplicate product slugs");
});

test("all agent slugs (products + tools + generated evaluators) are globally unique and don't collide with legacy seed agents", () => {
  const all: string[] = [];
  for (const c of CLAW_CATALOG) all.push(c.slug);
  for (const c of openclaws) {
    for (const t of c.tools) all.push(t.slug);
    all.push(buildEvaluatorDef(c).slug); // evaluator generated at seed time
  }
  assert.deepEqual(findDuplicates(all), [], "duplicate agent slugs across catalog");
  const legacyHits = all.filter((s) => LEGACY_AGENT_SLUGS.includes(s));
  assert.deepEqual(
    legacyHits,
    [],
    "catalog reuses agent slugs owned by the legacy seed files (would silently overwrite those agents)"
  );
});

test("slugs are well-formed (lowercase kebab-case, non-empty)", () => {
  const re = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  for (const c of CLAW_CATALOG) {
    assert.match(c.slug, re, `product slug malformed: ${JSON.stringify(c.slug)}`);
  }
  for (const c of openclaws) {
    for (const t of c.tools) {
      assert.match(t.slug, re, `[${c.slug}] tool slug malformed: ${JSON.stringify(t.slug)}`);
    }
  }
});

test("pricing follows the convention (or a documented exception)", () => {
  for (const c of CLAW_CATALOG) {
    const expected =
      PRICE_EXCEPTIONS[c.slug] ??
      (c.kind === "openclaw"
        ? { licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000 }
        : { licenseClass: 3, licensePrice: 5_000_000, monthlyPrice: 299_000 });
    assert.equal(c.licenseClass, expected.licenseClass, `[${c.slug}] licenseClass`);
    assert.equal(c.licensePrice, expected.licensePrice, `[${c.slug}] licensePrice`);
    assert.equal(c.monthlyPrice, expected.monthlyPrice, `[${c.slug}] monthlyPrice`);
  }
});

test("every OpenClaw entry has complete, non-empty required fields", () => {
  const nonEmpty = (s: unknown, label: string) => {
    assert.equal(typeof s, "string", `${label} must be a string`);
    assert.ok((s as string).trim().length > 0, `${label} must be non-empty`);
  };
  for (const c of openclaws) {
    const tag = `[${c.slug}]`;
    nonEmpty(c.name, `${tag} name`);
    nonEmpty(c.tagline, `${tag} tagline`);
    nonEmpty(c.avatar, `${tag} avatar`);
    nonEmpty(c.category, `${tag} category`);
    nonEmpty(c.docLabel, `${tag} docLabel`);
    nonEmpty(c.mission, `${tag} mission`);

    assert.ok(c.tools.length >= 1, `${tag} must have at least 1 tool`);
    for (const t of c.tools) {
      nonEmpty(t.slug, `${tag} tool slug`);
      nonEmpty(t.role, `${tag} tool ${t.slug} role`);
      nonEmpty(t.name, `${tag} tool ${t.slug} name`);
      nonEmpty(t.mission, `${tag} tool ${t.slug} mission`);
    }

    assert.equal(
      c.evaluatorCriteria.length,
      4,
      `${tag} evaluatorCriteria must have exactly 4 entries (a..d; e is auto)`
    );
    c.evaluatorCriteria.forEach((cr, i) => nonEmpty(cr, `${tag} evaluatorCriteria[${i}]`));

    assert.ok(c.structure.length >= 1, `${tag} structure must be non-empty`);
    c.structure.forEach((s, i) => nonEmpty(s, `${tag} structure[${i}]`));

    assert.ok(c.interviewTopics.length >= 1, `${tag} interviewTopics must be non-empty`);
    c.interviewTopics.forEach((s, i) => nonEmpty(s, `${tag} interviewTopics[${i}]`));
  }
});

test("every MultiClaw entry has complete member wiring", () => {
  const catalogProductSlugs = new Set(CLAW_CATALOG.map((c) => c.slug));
  for (const m of multiclaws) {
    const tag = `[${m.slug}]`;
    assert.ok(m.members.length >= 2, `${tag} MultiClaw needs at least 2 members`);
    assert.ok(m.mission.trim().length > 0, `${tag} mission must be non-empty`);
    assert.ok(m.routing.trim().length > 0, `${tag} routing must be non-empty`);
    for (const member of m.members) {
      assert.ok(
        catalogProductSlugs.has(member.slug) || LEGACY_PRODUCT_SLUGS.includes(member.slug),
        `${tag} member '${member.slug}' is not a known product slug`
      );
      assert.ok(member.role.trim().length > 0, `${tag} member ${member.slug} role empty`);
      assert.ok(member.desc.trim().length > 0, `${tag} member ${member.slug} desc empty`);
    }
  }
});
