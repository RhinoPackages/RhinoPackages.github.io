// Pure helpers that describe a package, shared by the directory cards and the
// static package pages. Free of React hooks so server components can use them.

import { Distribution, Filters, Package, YakVersionHistoryItem, has } from "./packageModel";

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

/** Yak fills an empty description with the literal "no description". */
export function hasDescription(pkg: Package) {
  const description = pkg.description.trim();
  return description.length > 0 && description.toLowerCase() !== "no description";
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

/** Other packages published by any of this package's owners, most downloaded first. */
export function packagesBySameOwners(pkg: Package, all: Package[], limit: number) {
  const owners = new Set(pkg.owners.map((owner) => owner.id));
  return all
    .filter((other) => other.id !== pkg.id && other.owners.some((owner) => owners.has(owner.id)))
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, limit);
}

export function keywordsOf(pkg: Package) {
  return pkg.keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
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

  const trimmedForEmail = raw.replace(/[;,.!?]+$/, "").trim();
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
