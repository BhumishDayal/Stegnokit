#!/usr/bin/env node
/**
 * One-time importer that fetches the top 50 popular meme templates from
 * imgflip's public API (no auth needed), saves the JPEGs into public/memes/,
 * and writes a JSON manifest at src/data/memes.json that the frontend
 * imports.
 *
 * Run from the project root:
 *   node scripts/fetch-memes.mjs
 *
 * Re-running is safe — it overwrites the same files.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");

const API = "https://api.imgflip.com/get_memes";
const OUT_DIR = path.join(PROJECT_ROOT, "public", "memes");
const MANIFEST = path.join(PROJECT_ROOT, "src", "data", "memes.json");
const COUNT = 50;

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function main() {
  console.log(`→ fetching meme list from ${API}`);
  const res = await fetch(API);
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(`API error: ${JSON.stringify(json.error_message)}`);

  // imgflip returns templates in popularity order — take the first COUNT.
  const memes = json.data.memes.slice(0, COUNT);
  console.log(`→ got ${memes.length} memes; downloading to ${path.relative(PROJECT_ROOT, OUT_DIR)}`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });

  const seenSlugs = new Set();
  const manifest = [];

  for (const m of memes) {
    let slug = slugify(m.name);
    if (!slug) slug = `meme-${m.id}`;
    let unique = slug;
    let n = 2;
    while (seenSlugs.has(unique)) unique = `${slug}-${n++}`;
    seenSlugs.add(unique);

    const ext = (path.extname(new URL(m.url).pathname) || ".jpg").toLowerCase();
    const filename = `${unique}${ext}`;
    const dest = path.join(OUT_DIR, filename);

    try {
      const r = await fetch(m.url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      await fs.writeFile(dest, buf);
      manifest.push({
        id: m.id,
        name: m.name,
        src: `/memes/${filename}`,
        width: m.width,
        height: m.height,
        bytes: buf.byteLength,
      });
      process.stdout.write(`  ✓ ${m.name}\n`);
    } catch (e) {
      process.stderr.write(`  ✗ ${m.name}: ${e.message}\n`);
    }
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  const total = manifest.reduce((a, b) => a + (b.bytes || 0), 0);
  console.log(
    `\n✓ wrote ${manifest.length} memes (${(total / 1024 / 1024).toFixed(2)} MB) ` +
      `→ ${path.relative(PROJECT_ROOT, MANIFEST)}`,
  );
}

main().catch((err) => {
  console.error("✗ FATAL:", err);
  process.exit(1);
});
