// Build-time access to the generator's output in public/, for the statically
// exported pages. Server-only: it reads from disk.

import fs from "fs";
import path from "path";
import type { HistoryPoint, Package, YakVersionHistoryItem } from "./packageModel";

const publicDir = path.join(process.cwd(), "public");

// Parsed once per build worker; every package page needs the full list for
// its "more by" and "related" sections.
let packagesCache: Package[] | null = null;
let packagesById: Map<string, Package> | null = null;

export function loadPackages(): Package[] {
  if (!packagesCache) {
    packagesCache = JSON.parse(fs.readFileSync(path.join(publicDir, "data.json"), "utf-8")) as Package[];
  }
  return packagesCache;
}

export function findPackage(id: string): Package | undefined {
  if (!packagesById) {
    packagesById = new Map(loadPackages().map((pkg) => [pkg.id, pkg]));
  }
  return packagesById.get(id);
}

function readJsonArray<T>(file: string): T[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    // Not every package has history files yet.
    return [];
  }
}

/** Every published version of a package, as written by the generator. */
export function loadVersionHistory(id: string): YakVersionHistoryItem[] {
  return readJsonArray<YakVersionHistoryItem>(path.join(publicDir, "data", "versions", `${id}.json`));
}

/** Daily download snapshots of a package. */
export function loadDownloadHistory(id: string): HistoryPoint[] {
  return readJsonArray<HistoryPoint>(path.join(publicDir, "data", "history", `${id}.json`));
}
