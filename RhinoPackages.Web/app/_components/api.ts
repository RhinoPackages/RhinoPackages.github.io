import { useEffect, useState } from "react";

export const pageResults = 25;

export interface Package {
  id: string;
  version: string;
  updated: string;
  authors: string;
  downloads: number;
  iconUrl: string;
  description: string;
  keywords: string;
  prerelease: boolean;
  homepageUrl?: string | null;
  filters: Filters;
  owners: Owner[];
  downloadsWeek?: number;
  downloadsMonth?: number;
  firstReleased?: string | null;
  versionCount?: number;
  lastReleased?: string | null;
  releaseCadenceDays?: number | null;
  sizeBytes?: number | null;
  license?: string | null;
}

export interface Distribution {
  filename: string;
  platform: string;
  rhinoVersion: string;
  url: string;
  createdAt?: string | null;
}

export interface DownloadsWindow {
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
}

export interface YakVersionHistoryItem {
  createdAt: string;
  version: string;
  distributions: Distribution[];
  prerelease: boolean;
  downloadCount?: number;
  downloads?: DownloadsWindow | null;
}

export interface HistoryPoint {
  date: string;
  downloads: number;
  week: number;
}

export interface TotalsPoint {
  date: string;
  packages: number;
  downloads: number;
}

export enum Filters {
  None = 0,
  Windows = 1,
  Mac = 2,
  Rhino = 4,
  Grasshopper = 8,
  Rhino6 = 16,
  Rhino7 = 32,
  Rhino8 = 64,
  Rhino9 = 128,
}

export interface Owner {
  id: number;
  name: string;
}

export class Status {
  message: "loading" | "idle" | string;

  constructor(message: string) {
    this.message = message;
  }

  public static loading() {
    return new Status("loading");
  }

  public static idle() {
    return new Status("idle");
  }

  public get isLoading() {
    return this.message === "loading";
  }

  public get isIdle() {
    return this.message === "idle";
  }

  public get isError() {
    return !this.isIdle && !this.isLoading;
  }
}

export function has(constant: Filters, pkg: Package) {
  return constant === (pkg.filters & constant);
}

export { TIME_ZONE, formatDate, formatDateTime } from "./format";

// A package is considered maintained when it published a release within the
// last year, and deprecated when it ships nothing for the current Rhino
// release. Rhino 9 only targets are forward-looking, not deprecated.
export const MAINTAINED_DAYS = 365;

export function isMaintained(pkg: Package, now: number = Date.now()) {
  return (now - new Date(pkg.updated).getTime()) / (1000 * 3600 * 24) <= MAINTAINED_DAYS;
}

export function isDeprecated(pkg: Package) {
  return !has(Filters.Rhino8, pkg) && !has(Filters.Rhino9, pkg);
}

export function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// Yak tracks authorship two ways: the account that publishes a package (an
// owner, with an id) and the free-text credit list. The same person is often
// an owner on some packages and only credited on others, and a handful hold
// more than one account, so match on the normalized name as well as the id.
export function matchesOwner(pkg: Package, ownerId: number, ownerName?: string) {
  if (pkg.owners.some((o) => o.id === ownerId)) return true;
  if (!ownerName) return false;

  const target = normalizeName(ownerName);

  // Second account belonging to the same person.
  if (pkg.owners.some((o) => normalizeName(o.name) === target)) return true;

  if (!isCreditableName(target)) return false;

  return pkg.authors.split(",").some((author) => normalizeName(author) === target);
}

/** A lone short first name ("Aaron") is too ambiguous to attribute. */
export function isCreditableName(normalized: string) {
  return normalized.includes(" ") || normalized.length >= 6;
}

export function useApi(initialCache: Package[] = []) {
  const [cache, setCache] = useState<Package[]>(initialCache);
  const [status, setStatus] = useState<Status>(Status.idle());

  useEffect(() => {
    if (initialCache.length > 0) {
      return;
    }

    (async () => {
      setStatus(Status.loading());
      try {
        const url = `/data.json`;
        const response = await fetch(url);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || response.statusText);
        }
        const data = (await response.json()) as Package[];
        setCache(data);
        setStatus(Status.idle());
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(new Status(message));
      }
    })();
  }, [initialCache.length]);

  return { cache, status };
}
