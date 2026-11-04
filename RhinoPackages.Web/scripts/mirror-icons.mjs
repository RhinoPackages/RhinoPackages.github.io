// Run in CI before `next build`: copies every remote package icon into
// public/icons/packages and points iconUrl in data.json at the copy. Remote
// hosts send no usable cache headers (yak's `_icon` is `no-cache`), so the
// browser refetched icons on every reload and they popped in late. Same-origin
// files get cached and need no extra connection. Icons that fail to download
// keep their remote URL, so the page still falls back as before.
//
//   node scripts/mirror-icons.mjs

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Largest icon on the site is 56px (package page), so this is sharp at 2x.
const maxIconSize = 112;

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const dataFile = path.join(root, "public", "data.json");
const dir = path.join(root, "public", "icons", "packages");
const types = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg", "image/x-icon": "ico" };
fs.mkdirSync(dir, { recursive: true });

const packages = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
const known = fs.readdirSync(dir);
// Same URL, same file: hashed names make reruns and the CI cache skip downloads.
const byUrl = new Map();

// Yak icons can be 1000px+ and hundreds of KB, shown at 40px. Keeps the format
// so the file extension stays right. GIF (may be animated), SVG and ICO pass
// through, as does anything sharp cannot read: a big icon beats no icon.
async function shrink(buffer, ext) {
  if (!["png", "jpg", "webp"].includes(ext)) return buffer;
  try {
    const { width, height } = await sharp(buffer).metadata();
    if (width <= maxIconSize && height <= maxIconSize) return buffer;
    const resized = await sharp(buffer).resize(maxIconSize, maxIconSize, { fit: "inside" }).toBuffer();
    return resized.length < buffer.length ? resized : buffer;
  } catch (e) {
    console.warn(`icon not resized (${e.message})`);
    return buffer;
  }
}

async function mirror(url) {
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 16);
  const cached = known.find((f) => f.startsWith(`${hash}.`));
  if (cached) return `/icons/packages/${cached}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const ext = types[(res.headers.get("content-type") ?? "").split(";")[0].trim()];
  if (!res.ok || !ext) throw new Error(`${res.status} ${res.headers.get("content-type")}`);
  fs.writeFileSync(path.join(dir, `${hash}.${ext}`), await shrink(Buffer.from(await res.arrayBuffer()), ext));
  return `/icons/packages/${hash}.${ext}`;
}

const remote = [...new Set(packages.map((p) => p.iconUrl).filter((u) => /^https?:\/\//i.test(u ?? "")))];
let next = 0;
let failed = 0;
await Promise.all(
  Array.from({ length: 16 }, async () => {
    while (next < remote.length) {
      const url = remote[next++];
      try {
        byUrl.set(url, await mirror(url));
      } catch (e) {
        failed++;
        console.warn(`icon kept remote: ${url} (${e.message})`);
      }
    }
  }),
);

for (const p of packages) if (byUrl.has(p.iconUrl)) p.iconUrl = byUrl.get(p.iconUrl);
fs.writeFileSync(dataFile, JSON.stringify(packages));
console.log(`mirrored ${byUrl.size}/${remote.length} icons (${failed} kept remote)`);
