import { describe, it } from "node:test";
import assert from "node:assert";
import { filter, Params, Sort } from "./PackageContext";
import { Filters, Package } from "./api";

const mockPackages: Package[] = [
  {
    id: "AlphaPackage",
    version: "1.0.0",
    updated: "2026-01-01",
    authors: "Author A",
    downloads: 1000,
    iconUrl: "",
    description: "First package",
    keywords: "alpha",
    prerelease: false,
    filters: Filters.Windows,
    owners: [],
  },
  {
    id: "zzctRhino",
    version: "2.0.0",
    updated: "2026-02-01",
    authors: "Author B",
    downloads: 500,
    iconUrl: "",
    description: "Target package for deep links",
    keywords: "zzct, rhino",
    prerelease: false,
    filters: Filters.Mac,
    owners: [],
  },
  {
    id: "BetaPackage",
    version: "1.5.0",
    updated: "2026-03-01",
    authors: "Author C",
    downloads: 2000,
    iconUrl: "",
    description: "Second package",
    keywords: "beta",
    prerelease: false,
    filters: Filters.Windows,
    owners: [],
  },
];

const baseParams: Params = {
  search: "",
  filters: Filters.None,
  sort: Sort.Downloads,
  page: 0,
};

describe("PackageContext filter deep link (?p=) pinning", () => {
  it("pins target package to position 0 when p is specified and package is in default list", () => {
    const params: Params = { ...baseParams, p: "zzctRhino" };
    const trendingScores = new Map<string, number>();

    const { visiblePackages } = filter(mockPackages, params, trendingScores);

    assert.strictEqual(visiblePackages.length, 3);
    assert.strictEqual(visiblePackages[0].id, "zzctRhino");
  });

  it("pins target package to position 0 even if search filter excludes it", () => {
    const params: Params = { ...baseParams, search: "Alpha", p: "zzctRhino" };
    const trendingScores = new Map<string, number>();

    const { visiblePackages } = filter(mockPackages, params, trendingScores);

    assert.strictEqual(visiblePackages[0].id, "zzctRhino");
    assert.strictEqual(visiblePackages[1].id, "AlphaPackage");
  });

  it("pins target package case-insensitively", () => {
    const params: Params = { ...baseParams, p: "zzctrhino" };
    const trendingScores = new Map<string, number>();

    const { visiblePackages } = filter(mockPackages, params, trendingScores);

    assert.strictEqual(visiblePackages[0].id, "zzctRhino");
  });

  it("does not alter list order when p is not specified", () => {
    const params: Params = { ...baseParams, p: undefined };
    const trendingScores = new Map<string, number>();

    const { visiblePackages } = filter(mockPackages, params, trendingScores);

    // Sorted by downloads descending: BetaPackage (2000), AlphaPackage (1000), zzctRhino (500)
    assert.strictEqual(visiblePackages[0].id, "BetaPackage");
    assert.strictEqual(visiblePackages[1].id, "AlphaPackage");
    assert.strictEqual(visiblePackages[2].id, "zzctRhino");
  });
});
