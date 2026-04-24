import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filters, Owner, Package, Status, has, pageResults, useApi } from "./api";

export enum Sort {
  Downloads,
  Date,
  Trending,
}

export interface Params {
  owner?: number;
  search: string;
  filters: Filters;
  sort: Sort;
  page: number;
  p?: string;
}

export const defaultParams: Params = {
  owner: undefined,
  search: "",
  filters: Filters.None,
  sort: Sort.Trending,
  page: 0,
  p: undefined,
};

interface PackageContext {
  packages: Package[];
  owners: Owner[];
  status: Status;
  controls: Params;
  stats: {
    totalPackages: number;
    totalDownloads: number;
    recentUpdates: number;
  };
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
    for (const p of cache ?? []) {
      const daysSinceUpdate = (now - new Date(p.updated).getTime()) / (1000 * 3600 * 24);
      scores.set(p.id, p.downloads / Math.pow(Math.max(1, daysSinceUpdate), 1.5));
    }
    return scores;
  }, [cache]);

  const packages = useMemo(() => {
    return filter(cache ?? [], params, trendingScores);
  }, [cache, params, trendingScores]);

  const owners = useMemo(() => {
    const set = new Set<number>();
    const owners: Owner[] = [];

    for (const pkg of cache) {
      for (const owner of pkg.owners) {
        if (set.has(owner.id)) continue;
        set.add(owner.id);
        owners.push(owner);
      }
    }
    return owners.sort((a, b) => a.id - b.id);
  }, [cache]);

  const stats = useMemo(() => {
    let totalDownloads = 0;
    let recentUpdates = 0;
    const now = Date.now();
    for (const pkg of cache ?? []) {
      totalDownloads += pkg.downloads;
      if ((now - new Date(pkg.updated).getTime()) / (1000 * 3600 * 24) <= 30) {
        recentUpdates++;
      }
    }
    return {
      totalPackages: cache?.length ?? 0,
      totalDownloads,
      recentUpdates,
    };
  }, [cache]);

  return (
    <PackageContext.Provider
      value={{
        packages,
        owners,
        status,
        controls,
        stats,
        navigate,
        navigateFilter,
        setSearch,
      }}
    >
      {children}
    </PackageContext.Provider>
  );
}

function filter(packages: Package[], params: Params, trendingScores: Map<string, number>) {
  const { owner, search, filters, sort, page } = params;
  let filtered = [...packages];

  if (owner !== undefined) {
    filtered = filtered.filter((p) => p.owners.some((o) => o.id === owner));
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
    filtered = filtered.filter((pkg) => has(filters, pkg));
  }

  if (sort === Sort.Date) {
    filtered = filtered.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  } else if (sort === Sort.Trending) {
    filtered = filtered.sort((a, b) => (trendingScores.get(a.id)! < trendingScores.get(b.id)! ? 1 : -1));
  } else {
    filtered = filtered.sort((a, b) => (a.downloads < b.downloads ? 1 : -1));
  }

  return filtered.slice(0, (page + 1) * pageResults);
}

import { ReadonlyURLSearchParams } from "next/navigation";

function toParams(searchParams: ReadonlyURLSearchParams | URLSearchParams): Params {
  function toInt<T>(param: string, defaultValue: T) {
    let result = parseInt(searchParams.get(param) ?? "") || defaultValue;
    if ((result as number) < 0) result = defaultValue;
    return result;
  }

  const owner = toInt("owner", NaN) || undefined;

  const search = searchParams.get("search") ?? "";

  const filters = toInt("filters", Filters.None);
  const sort = toInt("sort", Sort.Trending);
  const page = toInt("page", 0);

  const p = searchParams.get("p") || undefined;

  return {
    owner,
    search,
    filters,
    sort,
    page,
    p,
  };
}

function toQuery(params: Params) {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      urlParams.append(key, value.toString());
    }
  }
  const query = urlParams.toString();
  return !query ? "" : `?${query}`;
}
