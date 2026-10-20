import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateCiDatabaseEnvironment } from "../scripts/ci-test-database-guard.mjs";

const url = "postgres://ci_runner:disposable_ci_only@127.0.0.1:5432/gustafta_ci_integration_test";
const good = { GITHUB_ACTIONS: "true", NODE_ENV: "test", CI_TEST_DATABASE_URL: url, DATABASE_URL: url };

test("CI database guard permits only the explicitly isolated service", () => {
  assert.equal(validateCiDatabaseEnvironment(good), "gustafta_ci_integration_test");
  for (const patch of [
    { GITHUB_ACTIONS: "" }, { NODE_ENV: "production" }, { CI_TEST_DATABASE_URL: undefined },
    { DATABASE_URL: "postgres://application.invalid/live" },
    { DATABASE_URL_POOLED: url }, { TEST_DATABASE_URL: url },
    { OPENAI_API_KEY: ["unit", "fixture"].join("-") },
  ]) assert.throws(() => validateCiDatabaseEnvironment({ ...good, ...patch }));
  for (const bad of [
    url.replace("127.0.0.1", "database.example.com"),
    url.replace("gustafta_ci_integration_test", "application"),
    `${url}?options=-csearch_path=public`, `${url}#fragment`,
    url.replace("5432", "5433"), url.replace("ci_runner:", "other:"),
  ]) assert.throws(() => validateCiDatabaseEnvironment({ ...good, DATABASE_URL: bad, CI_TEST_DATABASE_URL: bad }));
});

test("provisioning proves empty database identity before importing application DB modules", () => {
  const source = readFileSync(new URL("../scripts/setup-ci-test-database.ts", import.meta.url), "utf8");
  assert.ok(source.indexOf("validateCiDatabaseEnvironment(process.env)") < source.indexOf("pool.connect()"));
  assert.ok(source.indexOf("existing.rowCount") < source.indexOf("generateMigration(generateDrizzleJson"));
  assert.ok(source.indexOf('client.query("COMMIT")') < source.indexOf('import("../server/db")'));
  assert.ok(!/DROP (?:SCHEMA|DATABASE)|secrets\.DATABASE_URL/.test(source));
});
