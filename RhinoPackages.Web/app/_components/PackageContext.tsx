import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  const [controls, setControls] = useState<Params>(defaultParams);
  const params = useMemo(() => toParams(searchParams), [searchParams]);

  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const navigate = useCallback(
    (value: { [Key in keyof Params]?: Params[Key] }) => {
      const currentControls = controlsRef.current;
      const newParams = { ...currentControls, ...value };
      // Only reset page to 0 if we are NOT explicitly navigating to a new page
      if (value.page === undefined) {
        newParams.page = 0;
      }
      setControls(newParams);
      router.push(`/${toQuery(newParams)}`, { scroll: false });
    },
    [router],
  );

  const navigateFilter = (filter: Filters, value: boolean) => {
    const filters = value ? controls.filters | filter : controls.filters & ~filter;
    navigate({ filters });
  };

  const setSearch = (text: string) => {
    setControls({ ...controls, search: text });
  };

  useEffect(() => {
    setControls(params);
  }, [params]);

  const packages = useMemo(() => {
    return filter(cache ?? [], params);
  }, [cache, params]);

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

function filter(packages: Package[], params: Params) {
  const { owner, search, filters, sort, page } = params;
  let filtered = [...packages];

  if (owner !== undefined) {
    filtered = filtered.filter((p) => p.owners.map((o) => o.id).includes(owner));
  }

  if (search) {
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
    const now = Date.now();
    const scores = new Map<string, number>();

    for (const p of filtered) {
      // Calculate days since the package was last updated
      const daysSinceUpdate = (now - new Date(p.updated).getTime()) / (1000 * 3600 * 24);
      // HackerNews-style gravity algorithm for trending logic
      scores.set(p.id, p.downloads / Math.pow(Math.max(1, daysSinceUpdate), 1.5));
    }

    filtered = filtered.sort((a, b) => (scores.get(a.id)! < scores.get(b.id)! ? 1 : -1));
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

  let search = searchParams.get("search") ?? "";
  if (search.length < 3) search = "";

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
