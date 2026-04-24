import { Filters, Package } from "./app/_components/api";
import { Sort } from "./app/_components/PackageContext";

// Mock data
const mockPackages: Package[] = Array.from({ length: 10000 }).map((_, i) => ({
  id: `pkg-${i}`,
  version: "1.0.0",
  updated: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  authors: "Author",
  downloads: Math.floor(Math.random() * 10000),
  iconUrl: "",
  description: "Description",
  keywords: "keyword",
  prerelease: false,
  filters: Filters.None,
  owners: [],
}));

const params = {
    owner: undefined,
    search: "",
    filters: Filters.None,
    sort: Sort.Trending,
    page: 0,
    p: undefined,
};

function has(constant: Filters, pkg: Package) { return constant === (pkg.filters & constant); }
const pageResults = 25;

// The optimized code from the real source file (or an exact copy of the logic)
function filterOptimized(packages: Package[], params: any, trendingScores: Map<string, number>) {
  const { owner, search, filters, sort, page } = params;
  let filtered = [...packages];

  if (owner !== undefined) {
    filtered = filtered.filter((p) => p.owners.map((o) => o.id).includes(owner));
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


const now = Date.now();
const trendingScores = new Map<string, number>();
for (const p of mockPackages) {
  const daysSinceUpdate = (now - new Date(p.updated).getTime()) / (1000 * 3600 * 24);
  trendingScores.set(p.id, p.downloads / Math.pow(Math.max(1, daysSinceUpdate), 1.5));
}

const startOptimized = performance.now();
for (let i = 0; i < 100; i++) {
  filterOptimized(mockPackages, params, trendingScores);
}
const endOptimized = performance.now();
console.log(`Optimized Code (10k items, 100 iterations): ${(endOptimized - startOptimized).toFixed(2)} ms`);
