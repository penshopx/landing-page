import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const boundary = "(?<![A-Za-z0-9_-])";
const rules = [
  ["brevo-key", new RegExp(`${boundary}xkeysib-[A-Za-z0-9_-]{10,}`)],
  ["provider-key", new RegExp(`${boundary}sk-[A-Za-z0-9_-]{20,}`)],
  ["underscore-key", new RegExp(`${boundary}sk_[A-Za-z0-9_-]{10,}`)],
  ["bearer-value", /Bearer [A-Za-z0-9._~+/-]{20,}/],
];
const variable = "(?:(?:DEEPSEEK|GEMINI|QWEN|NVIDIA|OPENROUTER|META_CAPI|META_PIXEL|SCALEV|BREVO|FONNTE|TENDER_INGEST)[A-Z_]*(?:API_KEY|ACCESS_TOKEN|WEBHOOK_SECRET|KEY)|SESSION_SECRET|NOTIFY_WEBHOOK_KEY)";
const quotedAssignment = new RegExp(`\\b${variable}\\s*=\\s*(["'])([A-Za-z0-9_.-]{16,})\\1`);
const fonnteAssignment = /\bFONNTE_API_KEY\s*=\s*(["'])[A-Za-z0-9_-]{10,}\1/;
const bareAssignment = new RegExp(`\\b${variable}\\s*=\\s*[A-Za-z0-9_.-]{16,}\\s*$`);

export function findProjectSecretMatches(text, path) {
  const config = path.endsWith(".replit") || /(?:^|\/)\.env(?:\.|$)/.test(path);
  return text.split(/\r?\n/).flatMap((line, index) => {
    const matches = rules.filter(([, expression]) => expression.test(line)).map(([name]) => name);
    if (quotedAssignment.test(line) || fonnteAssignment.test(line)
        || (config && bareAssignment.test(line))) matches.push("literal-credential-assignment");
    if (path.endsWith(".replit") && /^\s*\[userenv\.shared\]\s*(?:#.*)?$/.test(line)) {
      matches.push("shared-env-in-tracked-config");
    }
    if (config && /\bNOTIFICATION_WEBHOOK_URL\s*=.*[?&]key=[^&"'\s]{16,}/.test(line)) {
      matches.push("webhook-credential-in-url");
    }
    return [...new Set(matches)].map((rule) => ({ path, line: index + 1, rule }));
  });
}

const skip = /^(?:node_modules\/|dist\/|\.git\/|\.agents\/memory\/|scripts\/hooks\/|generated-artifacts\/)/;
const extension = /(?:\.(?:ts|tsx|js|mjs|json|env|replit|yml|yaml|sh|md)|(?:^|\/)\.env(?:\.[^/]+)?)$/;
export function scanProjectFiles(root = ".") {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).split("\0").filter(Boolean);
  const findings = [];
  for (const path of [...new Set(files)]) {
    if (skip.test(path) || !extension.test(path)
        || [".github/workflows/secret-scan.yml", "scripts/install-hooks.sh"].includes(path)) continue;
    findings.push(...findProjectSecretMatches(readFileSync(resolve(root, path), "utf8"), path));
  }
  return findings;
}

function annotation(value) {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A")
    .replaceAll(",", "%2C").replaceAll(":", "%3A");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const findings = scanProjectFiles();
    for (const finding of findings) {
      // Never print a matching line, credential, or provider response.
      console.error(`::error file=${annotation(finding.path)},line=${finding.line}::Project secret rule: ${finding.rule}`);
    }
    console.log(`${findings.length} project secret finding(s); values are never logged.`);
    if (findings.length) process.exitCode = 1;
  } catch {
    console.error("Project secret scan could not complete; refusing to report success.");
    process.exitCode = 1;
  }
}
