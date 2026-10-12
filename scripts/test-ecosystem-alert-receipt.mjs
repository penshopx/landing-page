/**
 * Manual receipt test for a disposable Healthchecks check only.
 * No production secrets, fail pings, automatic retry, or provider writes.
 */
import { pathToFileURL } from "node:url";

const TAG = "gustafta-isolated-receipt";
const NAME = "Gustafta isolated alarm receipt";
const ACTIONS = ["dry-run", "arm", "inspect", "recover"];
const KNOWN_STATES = ["new", "up", "grace", "down"];

export async function runReceiptTest(options, fetcher = globalThis.fetch) {
  const { action, confirmed, pingUrl, readOnlyKey } = options;
  if (!ACTIONS.includes(action)) return { status: "invalid_action" };
  // Offline means NO network, including metadata reads, and NO secrets needed.
  if (action === "dry-run") return { status: "dry_run", networkRequests: 0 };
  if (confirmed !== true) return { status: "confirmation_required" };
  if (typeof readOnlyKey !== "string" || !readOnlyKey || typeof pingUrl !== "string") {
    return { status: "missing_test_secrets" };
  }
  const match = /^https:\/\/hc-ping\.com\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.exec(pingUrl);
  if (!match) return { status: "invalid_test_url" };

  let check;
  try {
    const response = await fetcher(`https://healthchecks.io/api/v3/checks/${match[1]}`, {
      method: "GET",
      headers: { "X-Api-Key": readOnlyKey },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { status: "metadata_unavailable" };
    check = await response.json();
  } catch {
    return { status: "metadata_unavailable" };
  }
  // Require the documented read-only response shape, not a read-write key.
  // Read-only responses omit channel destinations; human receipt is separate.
  if (!check || typeof check !== "object" || Array.isArray(check) ||
      typeof check.unique_key !== "string" || !check.unique_key ||
      ["uuid", "ping_url", "update_url", "pause_url", "resume_url", "channels"].some(
        (field) => Object.hasOwn(check, field),
      ) ||
      check.name !== NAME || check.tags !== TAG ||
      check.schedule !== "* * * * *" || check.tz !== "UTC" ||
      check.grace !== 90 || check.started !== false ||
      check.filter_http_body !== false || check.filter_default_fail !== false ||
      !["", "POST"].includes(check.methods) || !KNOWN_STATES.includes(check.status)) {
    return { status: "fixture_not_isolated" };
  }
  if (action === "inspect") return { status: "inspected", checkStatus: check.status };
  // A repeated arm must not reset a down check and conceal missed heartbeats.
  if (action === "arm" && check.status !== "new") return { status: "arm_requires_new_check" };
  // Recovery must follow a genuine provider down state, not a simulated log.
  if (action === "recover" && check.status !== "down") return { status: "recovery_requires_down" };

  try {
    const response = await fetcher(pingUrl, {
      method: "POST",
      body: "",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const accepted = response.ok;
    void response.body?.cancel().catch(() => {});
    if (!accepted) return { status: "ping_delivery_uncertain" };
    return { status: action === "arm" ? "armed" : "recovery_ping_accepted" };
  } catch {
    // No retry: a timeout or failed response cannot prove no ping was received.
    return { status: "ping_delivery_uncertain" };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runReceiptTest({
    action: process.argv[2] ?? "dry-run",
    confirmed: process.env.CONFIRM_ISOLATED_RECEIPT_TEST === "true",
    pingUrl: process.env.ECOSYSTEM_RECEIPT_TEST_HEARTBEAT_URL,
    readOnlyKey: process.env.ECOSYSTEM_RECEIPT_TEST_READONLY_KEY,
  });
  console.log(JSON.stringify(result));
  if (!["dry_run", "inspected", "armed", "recovery_ping_accepted"].includes(result.status)) {
    process.exitCode = 1;
  }
}
