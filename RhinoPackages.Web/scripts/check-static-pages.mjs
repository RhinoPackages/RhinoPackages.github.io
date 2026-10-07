// Sanity check for the static export, run in CI after `next build`: every
// package in data.json must have its own crawlable page under out/package/,
// with its name in the title, a self-referencing canonical URL, and an entry
// in the sitemap. Catches a broken route or sitemap before it is deployed.
//
//   node scripts/check-static-pages.mjs

import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const out = path.join(root, "out");
const siteUrl = "https://rhinopackages.github.io";

const packages = JSON.parse(fs.readFileSync(path.join(root, "public", "data.json"), "utf-8"));
const sitemap = fs.readFileSync(path.join(out, "sitemap.xml"), "utf-8");
const index = fs.readFileSync(path.join(out, "packages.html"), "utf-8");

const decode = (text) =>
  text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

const problems = [];
for (const pkg of packages) {
  const url = `${siteUrl}/package/${encodeURIComponent(pkg.id)}`;
  const file = path.join(out, "package", `${pkg.id}.html`);
  if (!fs.existsSync(file)) {
    problems.push(`${pkg.id}: missing ${path.relative(root, file)}`);
    continue;
  }
  const html = fs.readFileSync(file, "utf-8");
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  if (!title.startsWith(`${pkg.id} – `)) problems.push(`${pkg.id}: unexpected title "${title}"`);
  if (!html.includes(`<link rel="canonical" href="${url}"/>`)) problems.push(`${pkg.id}: canonical is not ${url}`);
  if (!sitemap.includes(`<loc>${url}</loc>`)) problems.push(`${pkg.id}: not in sitemap.xml`);
  if (!index.includes(`href="/package/${encodeURIComponent(pkg.id)}"`)) problems.push(`${pkg.id}: not linked from /packages`);
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) with the static package pages:`);
  for (const problem of problems.slice(0, 50)) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`OK: ${packages.length} package pages exported, linked from /packages and listed in sitemap.xml.`);
