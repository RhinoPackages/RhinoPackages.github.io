import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Filters,
  Owner,
  Package,
  Status,
  has,
  isDeprecated,
  isMaintained,
  matchesFilters,
  matchesOwner,
  normalizeName,
  pageResults,
  useApi,
} from "./api";

export enum Sort {
  Downloads,
  Date,
  Trending,
  Rising,
}

export interface Params {
  owner?: number;
  search: string;
  /** Exact keyword match, set by the tag chips on a card. */
  tag?: string;
  filters: Filters;
  sort: Sort;
  page: number;
  p?: string;
  /** When true, the pre-releases toggle is expanded by default (used with ?p= deep links). */
  pre: boolean;
  /** Only show packages with a release in the last year. */
  maintained: boolean;
  /** Only show packages without support for the current Rhino release. */
  deprecated: boolean;
}

export const defaultParams: Params = {
  owner: undefined,
  search: "",
  tag: undefined,
  filters: Filters.None,
  sort: Sort.Trending,
  page: 0,
  p: undefined,
  pre: false,
  maintained: false,
  deprecated: false,
};

/**
 * Whether anything is narrowing the list. Shared by the sidebar's reset
 * button, the mobile filter badge and the empty state, which each used to
 * carry their own copy of this check and drifted apart as params were added.
 * Page and expanded package are navigation state, not filters.
 */
export function hasActiveFilters(controls: Params) {
  return (["search", "tag", "owner", "filters", "sort", "maintained", "deprecated"] as const).some(
    (key) => controls[key] !== defaultParams[key],
  );
}

export interface OwnerSummary {
  name: string;
  packages: number;
  owned: number;
  credited: number;
  downloads: number;
  weekly: number;
  lastUpdated?: string;
  firstReleased?: string;
}

interface PackageContext {
  packages: Package[];
  filteredCount: number;
  owners: Owner[];
  status: Status;
  controls: Params;
  stats: {
    totalPackages: number;
    totalDownloads: number;
    recentUpdates: number;
    weeklyDownloads: number;
  };
  filterCounts: Map<Filters, number>;
  statusCounts: { maintained: number; deprecated: number };
  /** Normalized owner name to account id, for crediting listed authors. */
  ownerIdByName: Map<string, number>;
  /** Aggregates for the author currently being filtered on, if any. */
  ownerSummary: OwnerSummary | null;
  navigate: (value: { [Key in keyof Params]?: Params[Key] }) => void;
  navigateFilter: (filter: Filters, value: boolean) => void;
  setSearch: (text: string) => void;
}

const PackageContext = createContext({} as PackageContext);

export function usePackageContext() {
  return useContext(PackageContext);
}

export function PackageProvider({
  children,
  initialCache = [],
}: {
  children: React.ReactNode;
  initialCache?: Package[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cache, status } = useApi(initialCache);
  const params = useMemo(() => toParams(searchParams), [searchParams]);
  const [controls, setControls] = useState<Params>(params);
  const controlsRef = useRef<Params>(params);

  useEffect(() => {
    controlsRef.current = params;
    setControls(params);
  }, [params]);

  const navigate = useCallback(
    (value: { [Key in keyof Params]?: Params[Key] }) => {
      const currentControls = controlsRef.current;
      const newParams = { ...currentControls, ...value };
      const shouldResetPage =
        value.page === undefined && Object.keys(value).some((key) => key !== "p");

      // Keep the current page when only toggling expanded package (p).
      if (shouldResetPage) {
        newParams.page = 0;
      }

      controlsRef.current = newParams;
      setControls(newParams);
      router.push(`/${toQuery(newParams)}`, { scroll: false });
    },
    [router],
  );

  const navigateFilter = useCallback(
    (filter: Filters, value: boolean) => {
      const currentFilters = controlsRef.current.filters;
      const filters = value ? currentFilters | filter : currentFilters & ~filter;
      navigate({ filters });
    },
    [navigate],
  );

  const setSearch = useCallback(
    (text: string) => {
      navigate({ search: text });
    },
    [navigate],
  );

  const trendingScores = useMemo(() => {
    const scores = new Map<string, number>();
    const now = Date.now();

    // Real weekly download counts from the Yak API; fall back to the old
    // recency heuristic until the generator has published the new fields.
    const hasWeekly = (cache ?? []).some((p) => (p.downloadsWeek ?? 0) > 0);

    for (const p of cache ?? []) {
      if (hasWeekly) {
        scores.set(p.id, (p.downloadsWeek ?? 0) + (p.downloadsMonth ?? 0) / 100);
      } else {
        const daysSinceUpdate = (now - new Date(p.updated).getTime()) / (1000 * 3600 * 24);
        scores.set(p.id, p.downloads / Math.pow(Math.max(1, daysSinceUpdate), 1.5));
      }
    }
    return scores;
  }, [cache]);

  // People with more than one Yak account would otherwise appear twice in
  // the picker with their packages split between the entries.
  const owners = useMemo(() => {
    const seen = new Set<string>();
    const owners: Owner[] = [];

    for (const pkg of cache) {
      for (const owner of pkg.owners) {
        const key = normalizeName(owner.name);
        if (seen.has(key)) continue;
        seen.add(key);
        owners.push(owner);
      }
    }
    return owners.sort((a, b) => a.id - b.id);
  }, [cache]);

  const ownerIdByName = useMemo(() => {
    const map = new Map<string, number>();
    for (const owner of owners) {
      map.set(normalizeName(owner.name), owner.id);
    }
    return map;
  }, [owners]);

  const ownerName = useMemo(() => {
    if (params.owner === undefined) return undefined;
    for (const pkg of cache ?? []) {
      const match = pkg.owners.find((o) => o.id === params.owner);
      if (match) return match.name;
    }
    return undefined;
  }, [cache, params.owner]);

  const { visiblePackages: packages, totalFiltered: filteredCount } = useMemo(() => {
    return filter(cache ?? [], params, trendingScores, ownerName);
  }, [cache, params, trendingScores, ownerName]);

  const ownerSummary = useMemo<OwnerSummary | null>(() => {
    if (params.owner === undefined || !ownerName) return null;

    const target = normalizeName(ownerName);
    const matched = (cache ?? []).filter((pkg) => matchesOwner(pkg, params.owner!, ownerName));
    if (matched.length === 0) return null;

    let owned = 0;
    let downloads = 0;
    let weekly = 0;
    let lastUpdated: string | undefined;
    let firstReleased: string | undefined;

    for (const pkg of matched) {
      const isOwner = pkg.owners.some(
        (o) => o.id === params.owner || normalizeName(o.name) === target,
      );
      if (isOwner) owned++;

      downloads += pkg.downloads;
      weekly += pkg.downloadsWeek ?? 0;

      if (!lastUpdated || pkg.updated > lastUpdated) lastUpdated = pkg.updated;
      if (pkg.firstReleased && (!firstReleased || pkg.firstReleased < firstReleased)) {
        firstReleased = pkg.firstReleased;
      }
    }

    return {
      name: ownerName,
      packages: matched.length,
      owned,
      credited: matched.length - owned,
      downloads,
      weekly,
      lastUpdated,
      firstReleased,
    };
  }, [cache, params.owner, ownerName]);

  const filterCounts = useMemo(() => {
    const flags = [
      Filters.Windows,
      Filters.Mac,
      Filters.Rhino6,
      Filters.Rhino7,
      Filters.Rhino8,
      Filters.Rhino9,
      Filters.Rhino,
      Filters.Grasshopper,
    ];
    const counts = new Map<Filters, number>(flags.map((f) => [f, 0]));
    for (const pkg of cache ?? []) {
      for (const flag of flags) {
        if (has(flag, pkg)) counts.set(flag, counts.get(flag)! + 1);
      }
    }
    return counts;
  }, [cache]);

  const statusCounts = useMemo(() => {
    const now = Date.now();
    let maintained = 0;
    let deprecated = 0;
    for (const pkg of cache ?? []) {
      if (isMaintained(pkg, now)) maintained++;
      if (isDeprecated(pkg)) deprecated++;
    }
    return { maintained, deprecated };
  }, [cache]);

  const stats = useMemo(() => {
    let totalDownloads = 0;
    let recentUpdates = 0;
    let weeklyDownloads = 0;
    const now = Date.now();
    for (const pkg of cache ?? []) {
      totalDownloads += pkg.downloads;
      weeklyDownloads += pkg.downloadsWeek ?? 0;
      if ((now - new Date(pkg.updated).getTime()) / (1000 * 3600 * 24) <= 30) {
        recentUpdates++;
      }
    }
    return {
      totalPackages: cache?.length ?? 0,
      totalDownloads,
      recentUpdates,
      weeklyDownloads,
    };
  }, [cache]);

  return (
    <PackageContext.Provider
      value={{
        packages,
        filteredCount,
        owners,
        status,
        controls,
        stats,
        filterCounts,
        statusCounts,
        ownerIdByName,
        ownerSummary,
        navigate,
        navigateFilter,
        setSearch,
      }}
    >
      {children}
    </PackageContext.Provider>
  );
}

function filter(
  packages: Package[],
  params: Params,
  trendingScores: Map<string, number>,
  ownerName?: string,
) {
  const { owner, search, tag, filters, sort, page, maintained, deprecated } = params;
  let filtered = [...packages];

  // Exact keyword match, unlike free-text search: the chips advertise a
  // specific tag, and short ones ("ai", "cnc") are both below the search
  // minimum length and prone to matching unrelated substrings.
  if (tag) {
    const wanted = tag.trim().toLowerCase();
    filtered = filtered.filter((pkg) =>
      pkg.keywords.split(",").some((keyword) => keyword.trim().toLowerCase() === wanted),
    );
  }

  if (maintained) {
    filtered = filtered.filter((pkg) => isMaintained(pkg));
  }

  if (deprecated) {
    filtered = filtered.filter((pkg) => isDeprecated(pkg));
  }

  if (owner !== undefined) {
    filtered = filtered.filter((p) => matchesOwner(p, owner, ownerName));
  }

  if (search.length >= 3) {
    const lower = search.toLowerCase();
    filtered = filtered.filter((p) => {
      return (
        p.id.toLowerCase().includes(lower) ||
        p.keywords.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
      );
    });
  }

  if (filters !== Filters.None) {
    filtered = filtered.filter((pkg) => matchesFilters(filters, pkg));
  }

  if (sort === Sort.Date) {
    filtered = filtered.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  } else if (sort === Sort.Trending) {
    filtered = filtered.sort((a, b) => (trendingScores.get(a.id)! < trendingScores.get(b.id)! ? 1 : -1));
  } else if (sort === Sort.Rising) {
    // Momentum: weekly downloads as a share of lifetime downloads. Same
    // eligibility floor as the stats page so tiny packages don't dominate.
    const risingScore = (p: Package) => {
      const week = p.downloadsWeek ?? 0;
      if (week < 20 || p.downloads < 100) return 0;
      return week / p.downloads;
    };
    filtered = filtered.sort((a, b) => {
      const diff = risingScore(b) - risingScore(a);
      return diff !== 0 ? diff : (b.downloadsWeek ?? 0) - (a.downloadsWeek ?? 0);
    });
  } else {
    filtered = filtered.sort((a, b) => (a.downloads < b.downloads ? 1 : -1));
  }

  let visiblePackages = filtered.slice(0, (page + 1) * pageResults);

  // Deep links (?p=name) must always show the target package, even when it
  // falls outside the current page or the active filters: pin it to the top.
  if (params.p && !visiblePackages.some((pkg) => pkg.id === params.p)) {
    const target = packages.find((pkg) => pkg.id === params.p);
    if (target) {
      visiblePackages = [target, ...visiblePackages];
    }
  }

  return {
    visiblePackages,
    totalFiltered: filtered.length,
  };
}

import { ReadonlyURLSearchParams } from "next/navigation";

function toParams(searchParams: ReadonlyURLSearchParams | URLSearchParams): Params {
  // Note: 0 is a valid value (e.g. sort=0 is Sort.Downloads), so we can't use
  // `parseInt(...) || defaultValue` — it would swallow zeros.
  function toInt<T>(param: string, defaultValue: T) {
    const parsed = parseInt(searchParams.get(param) ?? "");
    let result = Number.isNaN(parsed) ? defaultValue : parsed;
    if ((result as number) < 0) result = defaultValue;
    return result;
  }

  const owner = toInt("owner", NaN) || undefined;

  const search = searchParams.get("search") ?? "";
  const tag = searchParams.get("tag") || undefined;

  const filters = toInt("filters", Filters.None);
  const sort = toInt("sort", Sort.Trending);
  const page = toInt("page", 0);

  const p = searchParams.get("p") || undefined;
  const pre = searchParams.get("pre") === "true";
  const maintained = searchParams.get("maintained") === "true";
  const deprecated = searchParams.get("deprecated") === "true";

  return {
    owner,
    search,
    tag,
    filters,
    sort,
    page,
    p,
    pre,
    maintained,
    deprecated,
  };
}

function toQuery(params: Params) {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    // Skip values that match the defaults to keep URLs short, but keep
    // explicit non-default falsy values like sort=0 (Sort.Downloads).
    if (value === defaultParams[key as keyof Params]) continue;

    urlParams.append(key, value.toString());
  }
  const query = urlParams.toString();
  return !query ? "" : `?${query}`;
}
