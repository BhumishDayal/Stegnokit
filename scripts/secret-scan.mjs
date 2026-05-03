#!/usr/bin/env node
// Lightweight pre-commit / pre-deploy secret scanner.
// Walks the working tree (excluding node_modules, dist, .git) and fails the
// process if it finds a string that looks like an API key, private key, or
// known cloud-provider credential.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".vite",
  ".cache",
  "build",
  "coverage",
]);

// Files we deliberately scan for *examples* of placeholder names — they
// shouldn't trigger because they contain no real values.
const ALLOW_FILES = new Set([
  ".env.example",
  ".env.local.example",
  "scripts/secret-scan.mjs",
  "SECURITY.md",
]);

const PATTERNS = [
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "AWS secret",     re: /\b(?:aws_secret|secret_access_key)\s*[=:]\s*['"][A-Za-z0-9/+=]{40}['"]/i },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Stripe live key", re: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
  { name: "Stripe test key", re: /\bsk_test_[0-9a-zA-Z]{24,}\b/ },
  { name: "GitHub token",   re: /\bghp_[A-Za-z0-9]{36,}\b/ },
  { name: "GitHub PAT (fine-grained)", re: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/ },
  { name: "Hugging Face token", re: /\bhf_[A-Za-z0-9]{30,}\b/ },
  { name: "OpenAI key",     re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "Slack token",    re: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/ },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "JWT-shaped token", re: /\bey[JI][A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (st.size <= 5_000_000) yield full;
  }
}

const findings = [];
for (const path of walk(ROOT)) {
  const rel = relative(ROOT, path).replaceAll("\\", "/");
  if (ALLOW_FILES.has(rel)) continue;
  let body;
  try {
    body = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  for (const { name, re } of PATTERNS) {
    const m = body.match(re);
    if (m) findings.push({ rel, name, snippet: m[0].slice(0, 16) + "…" });
  }
}

if (findings.length === 0) {
  console.log("✓ secret-scan: no obvious credentials found in working tree");
  process.exit(0);
}

console.error("✗ secret-scan found potential credentials:\n");
for (const f of findings) {
  console.error(`  ${f.rel}  →  ${f.name}  (${f.snippet})`);
}
console.error("\nRemove these before committing. If a value is a placeholder,");
console.error("rename it or move it to .env.example which is allowlisted.\n");
process.exit(1);
