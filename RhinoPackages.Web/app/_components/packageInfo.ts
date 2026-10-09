// Pure helpers that describe a package, shared by the directory cards and the
// static package pages. Free of React hooks so server components can use them.

import {
  Distribution,
  Filters,
  Owner,
  Package,
  YakVersionHistoryItem,
  formatDate,
  has,
  isDeprecated,
  isMaintained,
  latestRelease,
  normalizeName,
} from "./packageModel";

/** Stand-in for packages whose icon cannot be shown: the yak version endpoint
 *  advertises an `_icon` URL for every package, but plenty of them 404 or are
 *  unreachable, which otherwise leaves a broken image in the card. */
export const defaultIconUrl = "/icons/special/default.png";

/** next/image only takes absolute or root-relative URLs; anything else falls
 *  back to the default icon instead of failing the static export. */
export function iconSrc(iconUrl: string | null | undefined) {
  return iconUrl && /^(https?:\/\/|\/)/i.test(iconUrl) ? iconUrl : defaultIconUrl;
}

/** The two platforms Rhino ships a yak executable for. */
export type YakPlatform = "windows" | "mac";

/** URL path of a package's static page, e.g. /package/Ladybug. */
export function packagePath(id: string) {
  return `/package/${encodeURIComponent(id)}`;
}

/**
 * URL path of an author's static page, e.g. /author/patrick-kastner. Lives here
 * rather than in authors.ts, which reads data.json from disk and so cannot be
 * imported by client components.
 */
export function authorPath(slug: string) {
  return `/author/${encodeURIComponent(slug)}`;
}

/**
 * What the directory's client code needs to know about an author, so cards can
 * link a name to its page without loading the author data themselves (see
 * authorRefs() in authors.ts). Defined here for the same reason as authorPath.
 */
export interface AuthorRef {
  /** Lowest account id: the one the directory's "?owner=" filter uses. */
  id: number;
  slug: string;
  name: string;
  /** Packages published or credited; the figure the author page shows. */
  count: number;
  /** Has a page that search engines see: 2+ packages. */
  indexed: boolean;
}

/**
 * One row of the /stats author table, computed on the server by
 * authorRankings() (authors.ts) so its numbers are the ones the author page
 * shows. Defined here for the same reason as AuthorRef.
 */
export interface AuthorRanking {
  name: string;
  /** Packages published or credited: the author page's "Packages". */
  packages: number;
  /** Downloads over those packages: the author page's "Total downloads". */
  downloads: number;
  /** The author page, set only for authors that have one search engines see (2+ packages). */
  href?: string;
  /** The one package of an author with no such page, which the row links to instead. */
  soloPackageId?: string;
}

/** Yak fills an empty description with the literal "no description". */
export function hasDescription(pkg: Package) {
  const description = pkg.description.trim();
  return description.length > 0 && description.toLowerCase() !== "no description";
}

/**
 * The home page's h1 while nothing narrows the list. The exported HTML (before
 * the list loads) and the list's own heading both say it, so it is written once.
 */
export function directoryHeading(total: number) {
  return `${total.toLocaleString("en-US")} Rhino & Grasshopper plugins`;
}

/** Rhino plugin, Grasshopper plugin, both, or neither flag set. */
export function pluginKind(pkg: Package) {
  const rhino = has(Filters.Rhino, pkg);
  const grasshopper = has(Filters.Grasshopper, pkg);
  if (rhino && grasshopper) return "Rhino & Grasshopper plugin";
  if (grasshopper) return "Grasshopper plugin";
  if (rhino) return "Rhino plugin";
  return "Rhino package";
}

export type StatusTone = "rose" | "amber" | "yellow" | "green";

/** Pill colours per status tone, light and dark; shared by the cards and the package page. */
export const statusToneClasses: Record<StatusTone, string> = {
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/20",
  yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20",
  green: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20",
};

export interface StatusBadge {
  label: string;
  tone: StatusTone;
  /** Tooltip with the rule behind the label. */
  title: string;
}

/**
 * Every status that applies to a package, most important first: no Rhino 8+
 * build, inactive, pre-release, new. Lists show the first, the package page
 * all of them. `lastRelease` (ms) lets a caller holding the full version
 * history count its newest entry too, like isMaintained().
 */
export function statusBadges(pkg: Package, now: number = Date.now(), lastRelease?: number): StatusBadge[] {
  const badges: StatusBadge[] = [];

  if (isDeprecated(pkg)) {
    badges.push({
      label: "No Rhino 8+ build",
      tone: "rose",
      title: "No build for the current Rhino release (Rhino 8) or for Rhino 9",
    });
  }

  if (!isMaintained(pkg, now, lastRelease)) {
    const last = Math.max(latestRelease(pkg).getTime(), lastRelease ?? 0);
    badges.push({
      label: "Inactive",
      tone: "amber",
      title: `Not actively maintained: no release since ${formatDate(last)}`,
    });
  }

  if (pkg.prerelease) {
    badges.push({
      label: "Pre-release",
      tone: "yellow",
      title: "Work in progress: the current version is a pre-release",
    });
  }

  const ageDays = pkg.firstReleased ? (now - new Date(pkg.firstReleased).getTime()) / (1000 * 3600 * 24) : null;
  if (ageDays !== null && ageDays <= 30) {
    badges.push({
      label: "New",
      tone: "green",
      title: "First released within the last 30 days",
    });
  }

  return badges;
}

/** Rhino releases a package ships builds for, oldest first. */
export function rhinoReleases(pkg: Package): number[] {
  const releases: [Filters, number][] = [
    [Filters.Rhino6, 6],
    [Filters.Rhino7, 7],
    [Filters.Rhino8, 8],
    [Filters.Rhino9, 9],
  ];
  return releases.filter(([flag]) => has(flag, pkg)).map(([, release]) => release);
}

/** "a, b & c" */
export function joinWithAnd(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} & ${items[items.length - 1]}`;
}

/** "Rhino 7, 8 & 9", or null when no release is flagged. */
export function rhinoVersionsText(pkg: Package) {
  const releases = rhinoReleases(pkg);
  return releases.length > 0 ? `Rhino ${joinWithAnd(releases.map(String))}` : null;
}

/** "Windows & Mac", "Windows", "Mac", or null. */
export function platformsText(pkg: Package) {
  const platforms = [has(Filters.Windows, pkg) && "Windows", has(Filters.Mac, pkg) && "Mac"].filter(
    (p): p is string => Boolean(p),
  );
  return platforms.length > 0 ? joinWithAnd(platforms) : null;
}

/** "Win & Mac", "Windows only", "Mac only", or null: the short form the cards use. */
export function platformsShort(pkg: Package) {
  const windows = has(Filters.Windows, pkg);
  const mac = has(Filters.Mac, pkg);
  if (windows && mac) return "Win & Mac";
  if (windows) return "Windows only";
  if (mac) return "Mac only";
  return null;
}

/**
 * The accounts that publish a package, one per person: accounts sharing a name
 * collapse into the one with the lowest id, in the order the names first
 * appear. The owner named `matchName` (the author filter) comes first.
 */
export function uniqueOwners(pkg: Package, matchName?: string): Owner[] {
  const byName = new Map<string, Owner>();
  for (const owner of pkg.owners) {
    const key = normalizeName(owner.name);
    const seen = byName.get(key);
    if (!seen || owner.id < seen.id) byName.set(key, owner);
  }

  const owners = Array.from(byName.values());
  if (matchName) {
    const target = normalizeName(matchName);
    const isMatch = (owner: Owner) => Number(normalizeName(owner.name) === target);
    owners.sort((a, b) => isMatch(b) - isMatch(a));
  }
  return owners;
}

/** Collapse whitespace and cut at a word boundary. */
export function truncate(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const atWord = cut.lastIndexOf(" ");
  return `${(atWord > max * 0.6 ? cut.slice(0, atWord) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

/** Page title, e.g. "Ladybug – Grasshopper plugin for Rhino 6, 7 & 8". */
export function packageTitle(pkg: Package) {
  const versions = rhinoVersionsText(pkg);
  return `${pkg.id} – ${pluginKind(pkg)}${versions ? ` for ${versions}` : ""}`;
}

/** Meta description: the author's own words first, then the facts. */
export function packageDescription(pkg: Package) {
  const kind = pluginKind(pkg);
  const versions = rhinoVersionsText(pkg);
  const platforms = platformsText(pkg);
  const target = [versions && `for ${versions}`, platforms && `on ${platforms}`].filter(Boolean).join(" ");
  const facts =
    `${kind}${target ? ` ${target}` : ""}. Version ${pkg.version}, ` +
    `${pkg.downloads.toLocaleString("en-US")} downloads. Download or install with one click.`;
  if (hasDescription(pkg)) {
    return `${pkg.id}: ${truncate(pkg.description, 140)} ${facts}`;
  }
  const by = pkg.authors.trim() ? ` by ${truncate(pkg.authors, 60)}` : "";
  return `${pkg.id}${by} is a ${facts.charAt(0).toLowerCase()}${facts.slice(1)}`;
}

/**
 * Builds published for the package's current version, falling back to the
 * newest stable release when the history has no exact match.
 */
export function latestDistributions(pkg: Package, history: YakVersionHistoryItem[]): Distribution[] {
  if (history.length === 0) return [];
  const exact = history.find((entry) => entry.version === pkg.version);
  if (exact) return exact.distributions;
  const newestStable = history
    .filter((entry) => !entry.prerelease)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  return (newestStable ?? history[0]).distributions;
}

export function keywordsOf(pkg: Package) {
  return pkg.keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

/** Keywords worth showing as chips: the ones that just repeat the package name are left out. */
export function displayKeywords(pkg: Package) {
  const id = pkg.id.toLowerCase();
  return keywordsOf(pkg).filter((keyword) => keyword.toLowerCase() !== id);
}

/**
 * Packages sharing keywords with this one: most shared keywords first, then
 * downloads. Packages listed in `exclude` (e.g. same author) are skipped.
 */
export function relatedPackages(pkg: Package, all: Package[], limit: number, exclude: Set<string>) {
  const own = new Set(keywordsOf(pkg).map((keyword) => keyword.toLowerCase()));
  if (own.size === 0) return [];
  return all
    .filter((other) => other.id !== pkg.id && !exclude.has(other.id))
    .map((other) => ({
      other,
      shared: keywordsOf(other).filter((keyword) => own.has(keyword.toLowerCase())).length,
    }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.other.downloads - a.other.downloads)
    .slice(0, limit)
    .map(({ other }) => other);
}

export function parseWebsiteAction(homepageUrl: Package["homepageUrl"]) {
  const raw = typeof homepageUrl === "string" ? homepageUrl.trim() : "";
  if (!raw) {
    return { websiteHref: undefined, emailHref: undefined };
  }

  // Some packages already declare "mailto:addr"; keep a single prefix.
  const trimmedForEmail = raw.replace(/[;,.!?]+$/, "").trim().replace(/^mailto:/i, "");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(trimmedForEmail)) {
    return { websiteHref: undefined, emailHref: `mailto:${trimmedForEmail}` };
  }

  const trimmedForWebsite = raw.replace(/[;\s]+$/, "").trim();
  if (!trimmedForWebsite) {
    return { websiteHref: undefined, emailHref: undefined };
  }

  if (/^https?:\/\//i.test(trimmedForWebsite)) {
    try {
      const parsed = new URL(trimmedForWebsite);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return { websiteHref: trimmedForWebsite, emailHref: undefined };
      }
    } catch {
      return { websiteHref: undefined, emailHref: undefined };
    }
    return { websiteHref: undefined, emailHref: undefined };
  }

  const domainLikePattern = /^(localhost|([a-z0-9-]+\.)+[a-z]{2,})(:\d+)?(\/.*)?$/i;
  if (domainLikePattern.test(trimmedForWebsite)) {
    return { websiteHref: `https://${trimmedForWebsite}`, emailHref: undefined };
  }

  return { websiteHref: undefined, emailHref: undefined };
}

export function platformLabel(platform: YakPlatform): string {
  return platform === "windows" ? "Windows" : "macOS";
}

/**
 * Which Rhino the command line should point at. Yak lives inside a specific
 * Rhino installation rather than on PATH, so the path has to name a release
 * this package actually supports. Prefer the newest stable one; only send
 * people to the WIP when that is the sole target.
 */
export function yakRhinoRelease(pkg: Package): string {
  if ((pkg.filters & Filters.Rhino8) === Filters.Rhino8) return "8";
  if ((pkg.filters & Filters.Rhino9) === Filters.Rhino9) return "9 WIP";
  if ((pkg.filters & Filters.Rhino7) === Filters.Rhino7) return "7";
  if ((pkg.filters & Filters.Rhino6) === Filters.Rhino6) return "6";
  return "8";
}

/**
 * The yak invocation for one package. Both platforms need the executable's
 * full path because neither installer puts it on PATH, and both paths contain
 * a space, so both stay quoted — which on Windows means PowerShell's call
 * operator, since a quoted string on its own is just a string there.
 */
export function yakInstallCommand(
  platform: YakPlatform,
  release: string,
  packageId: string,
  version?: string | null
): string {
  const target = version ? `${packageId} ${version}` : packageId;
  return platform === "windows"
    ? `& "C:\\Program Files\\Rhino ${release}\\System\\Yak.exe" install ${target}`
    : `"/Applications/Rhino ${release}.app/Contents/Resources/bin/yak" install ${target}`;
}

export function formatDistributionTarget(distribution: Distribution): string {
  const platform = distribution.platform === "win"
    ? "Windows"
    : distribution.platform === "mac"
      ? "Mac"
      : "Windows & Mac";
  const rhinoVersion = distribution.rhinoVersion === "any"
    ? "Any Rhino version"
    : `Rhino ${distribution.rhinoVersion.replace(/^rh/, "").replace("_", ".")}`;

  return `${platform} · ${rhinoVersion}`;
}

export type GroupedVersionHistoryRow = {
  createdAt: string;
  version: string;
  installVersion: string | null;
  installVersionByRhino: Map<string, string>;
  distributions: Distribution[];
  prerelease: boolean;
  downloadCount: number;
};

export function groupVersionHistory(items: YakVersionHistoryItem[]): GroupedVersionHistoryRow[] {
  const grouped = new Map<string, GroupedVersionHistoryRow & { versions: Set<string> }>();

  for (const item of items) {
    const normalized = normalizeVersionForGrouping(item);
    const key = `${normalized.baseVersion}__${item.prerelease ? "pre" : "stable"}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        createdAt: item.createdAt,
        version: normalized.baseVersion,
        installVersion: item.version,
        installVersionByRhino: new Map<string, string>(),
        distributions: [...item.distributions],
        prerelease: item.prerelease,
        downloadCount: item.downloadCount ?? 0,
        versions: new Set([item.version]),
      });
      for (const dist of item.distributions) {
        grouped.get(key)!.installVersionByRhino.set(dist.rhinoVersion, item.version);
      }
      continue;
    }

    if (new Date(item.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      existing.createdAt = item.createdAt;
    }

    for (const dist of item.distributions) {
      if (!existing.distributions.some((d) => d.url === dist.url)) {
        existing.distributions.push(dist);
      }
      const current = existing.installVersionByRhino.get(dist.rhinoVersion);
      if (!current || compareNumericVersions(item.version, current) > 0) {
        existing.installVersionByRhino.set(dist.rhinoVersion, item.version);
      }
    }

    existing.downloadCount += item.downloadCount ?? 0;
    existing.versions.add(item.version);
  }

  return Array.from(grouped.values())
    .map((row) => ({
      createdAt: row.createdAt,
      version: row.version,
      installVersion: row.versions.size === 1 ? row.installVersion : null,
      installVersionByRhino: row.installVersionByRhino,
      distributions: row.distributions,
      prerelease: row.prerelease,
      downloadCount: row.downloadCount,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface ReleaseFacts {
  /** Grouped release rows: the same count the version table shows. */
  count: number;
  firstReleased: Date | null;
  /** Average days between releases, when it can be told. */
  cadenceDays: number | null;
  /** Average downloads per day since the first release. */
  perDay: number | null;
  /**
   * Share of the per-release downloads that went to the version the page
   * shows (pkg.version, named as the page names it). Null when no row is
   * that version, when it rounds to 0%, or when the rows do not add up to
   * the package's total downloads, since a share of a different total would
   * sit next to it unexplained.
   */
  latestShare: { version: string; percent: number } | null;
}

/**
 * Release facts measured on the grouped history rows, so the count, cadence
 * and share agree with the table below them (pkg.versionCount counts raw
 * items and is higher for the packages that publish one build per Rhino
 * release). Only without a history file does it fall back to the package's
 * own fields.
 */
export function releaseFacts(
  pkg: Package,
  rows: GroupedVersionHistoryRow[],
  now: number = Date.now(),
): ReleaseFacts {
  const day = 1000 * 3600 * 24;
  const times = rows.map((row) => new Date(row.createdAt).getTime()).filter((t) => Number.isFinite(t));

  let firstReleased = pkg.firstReleased ? new Date(pkg.firstReleased) : null;
  if (!firstReleased && times.length > 0) firstReleased = new Date(Math.min(...times));

  const count = rows.length > 0 ? rows.length : (pkg.versionCount ?? 0);
  const spanDays = times.length > 1 ? (Math.max(...times) - Math.min(...times)) / day : 0;
  const cadenceDays =
    rows.length > 1 && spanDays > 0 ? spanDays / (rows.length - 1) : (pkg.releaseCadenceDays ?? null);

  const ageDays = firstReleased ? (now - firstReleased.getTime()) / day : null;
  const perDay = ageDays !== null && ageDays >= 1 ? pkg.downloads / ageDays : null;

  // The share belongs to the version the page shows, which is not always the
  // newest row when versions were uploaded out of order. A row matches by its
  // grouped version, its install version, or its grouped version with a
  // trailing Rhino major collapsed off ("3.0" for 3.0.8); the most specific
  // match wins, stable before pre-release.
  const total = rows.reduce((sum, row) => sum + row.downloadCount, 0);
  const matchRank = (row: GroupedVersionHistoryRow): number =>
    row.version === pkg.version || row.installVersion === pkg.version
      ? 2
      : pkg.version.startsWith(`${row.version}.`)
        ? 1
        : 0;
  const current = rows
    .filter((row) => matchRank(row) > 0)
    .sort(
      (a, b) =>
        Number(a.prerelease) - Number(b.prerelease) ||
        matchRank(b) - matchRank(a) ||
        b.version.length - a.version.length,
    )[0];
  const rowsMatchTotal = Math.abs(total - pkg.downloads) <= pkg.downloads * 0.1;
  const percent = current && total > 0 ? Math.round((current.downloadCount / total) * 100) : 0;
  // A 0% share reads as noise next to the cadence, so it is left out.
  const latestShare = rowsMatchTotal && percent > 0 ? { version: pkg.version, percent } : null;

  return { count, firstReleased, cadenceDays, perDay, latestShare };
}

function normalizeVersionForGrouping(item: YakVersionHistoryItem): { baseVersion: string } {
  const majors = Array.from(
    new Set(
      item.distributions
        .map((d) => {
          const match = d.rhinoVersion.match(/^rh(\d+)_/);
          return match ? Number(match[1]) : null;
        })
        .filter((v): v is number => v !== null)
    )
  );

  const parts = item.version.split(".");
  const lastPart = Number(parts[parts.length - 1]);
  const canCollapse = parts.length > 1 && Number.isInteger(lastPart) && majors.length === 1 && lastPart === majors[0];

  return { baseVersion: canCollapse ? parts.slice(0, -1).join(".") : item.version };
}

function compareNumericVersions(a: string, b: string): number {
  const aParts = a.split(".").map((p) => Number(p));
  const bParts = b.split(".").map((p) => Number(p));
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const av = Number.isFinite(aParts[i]) ? aParts[i] : 0;
    const bv = Number.isFinite(bParts[i]) ? bParts[i] : 0;
    if (av !== bv) return av - bv;
  }

  return 0;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

// Sub-day cadences are common for very active packages, so avoid rounding
// them down to a meaningless "every ~0d".
export function formatCadence(days: number): string {
  if (days < 1) return "multiple per day";
  if (days < 10) return `every ~${days.toFixed(1)}d`;
  if (days < 60) return `every ~${Math.round(days)}d`;
  return `every ~${Math.round(days / 30)}mo`;
}
