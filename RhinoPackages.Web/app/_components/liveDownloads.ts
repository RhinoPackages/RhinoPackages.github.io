"use client";

import { useEffect, useState } from "react";
import type { HistoryPoint, Package } from "./packageModel";

/**
 * Live lifetime download counts, from the Cloudflare Worker in /worker.
 *
 * The site is exported at build time, a few times a day, so its numbers lag
 * the Yak API. When NEXT_PUBLIC_LIVE_DOWNLOADS_URL is set, every page fetches
 * the current count of every package once and lays it over the build-time
 * data. The daily history recorded by the generator is left alone; the live
 * count only adds or refreshes "today". Without the variable, or when the
 * worker cannot be reached, the build-time numbers stand.
 */
const endpoint = liveEndpoint(process.env.NEXT_PUBLIC_LIVE_DOWNLOADS_URL);

/**
 * The worker's /downloads URL. Accepts either that URL or the worker's bare
 * address (https://<name>.<account>.workers.dev), which answers 404 at "/".
 */
export function liveEndpoint(configured: string | undefined): string | undefined {
  const value = configured?.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.pathname === "/" || url.pathname === "") url.pathname = "/downloads";
    return url.toString();
  } catch {
    return undefined;
  }
}

export type LiveDownloads = Map<string, number>;

// One request per page load, shared by every component that asks.
let request: Promise<LiveDownloads | null> | null = null;
let resolved: LiveDownloads | null = null;

export function fetchLiveDownloads(): Promise<LiveDownloads | null> {
  if (!endpoint || typeof window === "undefined") return Promise.resolve(null);
  request ??= fetch(endpoint)
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { downloads?: Record<string, number> } | null) => {
      if (!body?.downloads) return null;
      resolved = new Map(Object.entries(body.downloads));
      return resolved;
    })
    .catch(() => null);
  return request;
}

/** The live counts once they arrive; null before that or when unavailable. */
export function useLiveDownloads(): LiveDownloads | null {
  const [live, setLive] = useState<LiveDownloads | null>(resolved);
  useEffect(() => {
    let active = true;
    fetchLiveDownloads().then((value) => active && value && setLive(value));
    return () => {
      active = false;
    };
  }, []);
  return live;
}

/**
 * A package with its live count. Downloads since the build happened after the
 * weekly and monthly windows were measured, so they count towards both.
 * A live count below the build-time one (a stale cache somewhere) is ignored.
 */
export function withLiveCount(pkg: Package, live: LiveDownloads | null): Package {
  const current = live?.get(pkg.id);
  if (current === undefined || current <= pkg.downloads) return pkg;
  const gained = current - pkg.downloads;
  return {
    ...pkg,
    downloads: current,
    downloadsWeek: (pkg.downloadsWeek ?? 0) + gained,
    downloadsMonth: (pkg.downloadsMonth ?? 0) + gained,
  };
}

export function withLiveCounts(packages: Package[], live: LiveDownloads | null): Package[] {
  return live ? packages.map((pkg) => withLiveCount(pkg, live)) : packages;
}

/** The recorded daily history with today's point set to the live count. */
export function withLiveToday(points: HistoryPoint[], current: number | undefined): HistoryPoint[] {
  const last = points[points.length - 1];
  if (current === undefined || !last || current <= last.downloads) return points;
  const today = new Date().toISOString().slice(0, 10);
  if (last.date === today) return [...points.slice(0, -1), { ...last, downloads: current }];
  return [...points, { date: today, downloads: current, week: last.week + (current - last.downloads) }];
}
