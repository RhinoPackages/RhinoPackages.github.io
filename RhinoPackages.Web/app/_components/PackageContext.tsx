import { createContext, useContext, useMemo, useState } from "react";
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

export function PackageProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cache, status } = useApi();
  const [controls, setControls] = useState<Params>(defaultParams);

  const navigate = (value: { [Key in keyof Params]?: Params[Key] }) => {
    const newParams = { ...controls, ...value };
    // Only reset page to 0 if we are NOT explicitly navigating to a new page
    if (value.page === undefined) {
      newParams.page = 0;
    }
    setControls(newParams);
    router.push(`/${toQuery(newParams)}`, { scroll: false });
  };

  const navigateFilter = (filter: Filters, value: boolean) => {
    const filters = value ? controls.filters | filter : controls.filters & ~filter;
    navigate({ filters });
  };

  const setSearch = (text: string) => {
    setControls({ ...controls, search: text });
  };

  const packages = useMemo(() => {
    const params = toParams(searchParams);
    setControls(params);
    return filter(cache ?? [], params);
  }, [cache, searchParams]);

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

  if (owner !== undefined) {
    packages = packages.filter((p) => p.owners.map((o) => o.id).includes(owner));
  }

  if (search) {
    const lower = search.toLowerCase();
    packages = packages.filter((p) => {
      return (
        p.id.toLowerCase().includes(lower) ||
        p.keywords.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
      );
    });
  }

  if (filters !== Filters.None) {
    packages = packages.filter((pkg) => has(filters, pkg));
  }

  if (sort === Sort.Date) {
    packages = packages.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  } else if (sort === Sort.Trending) {
    const now = Date.now();
    const getScore = (p: Package) => {
      // Calculate days since the package was last updated
      const daysSinceUpdate = (now - new Date(p.updated).getTime()) / (1000 * 3600 * 24);
      // HackerNews-style gravity algorithm for trending logic
      return p.downloads / Math.pow(Math.max(1, daysSinceUpdate), 1.5);
    };
    packages = packages.sort((a, b) => (getScore(a) < getScore(b) ? 1 : -1));
  } else {
    packages = packages.sort((a, b) => (a.downloads < b.downloads ? 1 : -1));
  }

  return packages.slice(0, (page + 1) * pageResults);
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
