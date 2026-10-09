"use client";

import { Filters, Package, TotalsPoint, compactNumber, formatDate, formatDay, formatMonth, has, latestRelease, useApi } from "@/app/_components/api";
import { AuthorRanking, packagePath } from "@/app/_components/packageInfo";
import { useEffect, useMemo, useState } from "react";
import { nearestIndex, timePositions } from "./chart";
import PackageIcon from "./PackageIcon";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import Spinner from "./Spinner";

export default function StatsPageClient({
  initialCache = [],
  authors,
}: {
  initialCache?: Package[];
  /** Every author, ranked by downloads, worked out on the server (see authorRankings()). */
  authors: AuthorRanking[];
}) {
  const { cache, status } = useApi(initialCache);
  const stats = useMemo(() => getStats(cache), [cache]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authorQuery, setAuthorQuery] = useState(searchParams.get("author") ?? "");
  const [risingQuery, setRisingQuery] = useState(searchParams.get("rising") ?? "");
  const [moversQuery, setMoversQuery] = useState(searchParams.get("movers") ?? "");

  // Keep all three table filters shareable via /stats?author=...&rising=...&movers=...
  const syncQuery = (next: { author?: string; rising?: string; movers?: string }) => {
    const params = new URLSearchParams();
    const author = next.author ?? authorQuery;
    const rising = next.rising ?? risingQuery;
    const movers = next.movers ?? moversQuery;
    if (author) params.set("author", author);
    if (rising) params.set("rising", rising);
    if (movers) params.set("movers", movers);
    const query = params.toString();
    router.replace(query ? `/stats?${query}` : "/stats", { scroll: false });
  };

  const updateAuthorQuery = (value: string) => {
    setAuthorQuery(value);
    syncQuery({ author: value });
  };

  const updateRisingQuery = (value: string) => {
    setRisingQuery(value);
    syncQuery({ rising: value });
  };

  const updateMoversQuery = (value: string) => {
    setMoversQuery(value);
    syncQuery({ movers: value });
  };
  const [totals, setTotals] = useState<TotalsPoint[] | null>(null);
  const [weight, setWeight] = useState<Weight>("downloads");

  const distTotals = useMemo(
    () => ({
      packages: stats?.totalPackages ?? 0,
      downloads: stats?.totalDownloads ?? 0,
    }),
    [stats],
  );

  // Biggest absolute gainers, as opposed to Rising Stars which ranks by
  // momentum relative to a package's own history.
  const moversAll = useMemo(() => {
    return cache
      .filter((p) => (p.downloadsWeek ?? 0) > 0)
      .sort((a, b) => (b.downloadsWeek ?? 0) - (a.downloadsWeek ?? 0))
      .map((pkg, i) => ({ pkg, rank: i + 1 }));
  }, [cache]);

  const movers = useMemo(() => {
    const query = moversQuery.trim().toLowerCase();
    const pool = query ? moversAll.filter(({ pkg }) => pkg.id.toLowerCase().includes(query)) : moversAll;
    return pool.slice(0, 10);
  }, [moversAll, moversQuery]);

  useEffect(() => {
    // Daily ecosystem snapshots; the chart appears once at least two
    // days of data have been collected.
    fetch("./data/history/_totals.json")
      .then((r) => {
        if (!r.ok) throw new Error("No totals history");
        return r.json();
      })
      .then((data: TotalsPoint[]) => setTotals(data))
      .catch(() => setTotals([]));
  }, []);

  // Cumulative package count by month of first release.
  const growth = useMemo(() => {
    const months = new Map<string, number>();
    for (const pkg of cache) {
      if (!pkg.firstReleased) continue;
      const d = new Date(pkg.firstReleased);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.set(key, (months.get(key) ?? 0) + 1);
    }
    if (months.size < 2) return null;

    const keys = Array.from(months.keys()).sort();
    const [startYear, startMonth] = keys[0].split("-").map(Number);
    const now = new Date();
    const values: number[] = [];
    const labels: string[] = [];
    const januaries: { index: number; year: number }[] = [];
    let running = 0;

    for (let y = startYear, m = startMonth; y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1); ) {
      if (m === 1) januaries.push({ index: values.length, year: y });
      const key = `${y}-${String(m).padStart(2, "0")}`;
      running += months.get(key) ?? 0;
      values.push(running);
      labels.push(formatMonth(key));
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    // Year gridlines; thin them out when the range is long.
    const yearStep = Math.max(1, Math.ceil(januaries.length / 8));
    const ticks = januaries
      .filter((j, i) => i % yearStep === 0)
      .map((j) => ({ position: values.length > 1 ? j.index / (values.length - 1) : 0, label: String(j.year) }));

    return { values, labels, start: formatMonth(keys[0]), end: "today", ticks };
  }, [cache]);

  // Small packages gaining unusual momentum: weekly downloads as a share
  // of lifetime downloads.
  const risingAll = useMemo(() => {
    return cache
      .filter((p) => (p.downloadsWeek ?? 0) >= 20 && p.downloads >= 100)
      .map((p) => ({ pkg: p, ratio: (p.downloadsWeek ?? 0) / p.downloads }))
      .sort((a, b) => b.ratio - a.ratio)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }, [cache]);

  const risingStars = useMemo(() => {
    const query = risingQuery.trim().toLowerCase();
    const pool = query ? risingAll.filter((r) => r.pkg.id.toLowerCase().includes(query)) : risingAll;
    return pool.slice(0, 10);
  }, [risingAll, risingQuery]);

  // Ranked once, so a search still shows each author's place in the full list.
  const rankedAuthors = useMemo(() => authors.map((author, i) => ({ ...author, rank: i + 1 })), [authors]);

  const visibleAuthors = useMemo(() => {
    const query = authorQuery.trim().toLowerCase();
    const pool = query ? rankedAuthors.filter((a) => a.name.toLowerCase().includes(query)) : rankedAuthors;
    return pool.slice(0, 15);
  }, [rankedAuthors, authorQuery]);

  if (status.isLoading && cache.length === 0) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40"
        aria-live="polite"
        aria-busy="true"
      >
        <Spinner />
        <p className="mt-4 text-sm font-medium text-gray-500 dark:text-zinc-400">
          Loading statistics...
        </p>
      </div>
    );
  }

  if ((status.isError && cache.length === 0) || !stats) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 p-12 text-center dark:border-red-900/50 dark:bg-red-950/20"
        role="alert"
        aria-live="assertive"
      >
        <svg
          className="mx-auto h-12 w-12 text-red-500 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="mt-4 text-sm font-semibold text-red-800 dark:text-red-300">
          Error loading statistics
        </h2>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">{status.message}</p>
      </div>
    );
  }

  // The page heading and the spacing around this are the server page's.
  return (
    <div className="flex flex-col gap-8">
      {/* Headline numbers */}
      <section aria-labelledby="stats-overview">
        <h2 id="stats-overview" className="sr-only">
          Overview
        </h2>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Packages" value={stats.totalPackages.toLocaleString("en-US")} />
          <StatTile label="Total Downloads" value={stats.totalDownloads.toLocaleString("en-US")} />
          <StatTile
            label="Downloads / Week"
            value={stats.weeklyDownloads > 0 ? stats.weeklyDownloads.toLocaleString("en-US") : "—"}
            accent
          />
          <StatTile label="New This Month" value={stats.newThisMonth.length.toLocaleString("en-US")} />
        </dl>
      </section>

      {/* Distribution bars */}
      <section aria-labelledby="stats-distribution">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2
            id="stats-distribution"
            className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
          >
            Ecosystem Breakdown
          </h2>
          <div
            role="group"
            aria-label="Weight the breakdown by"
            className="flex rounded-md border border-gray-200 p-0.5 text-xs dark:border-zinc-800"
          >
            {(["packages", "downloads"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={weight === option}
                onClick={() => setWeight(option)}
                className={`rounded px-2.5 py-1 font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  weight === option
                    ? "bg-brand-600 text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                By {option}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <BarSection
            title="Plugin Type"
            weight={weight}
            total={distTotals}
            rows={[
              { label: "Grasshopper", bucket: stats.dist.grasshopper },
              { label: "Rhino", bucket: stats.dist.rhino },
              { label: "Both", bucket: stats.dist.bothTypes },
            ]}
          />
          <BarSection
            title="Platform Support"
            weight={weight}
            total={distTotals}
            rows={[
              { label: "Cross-platform", bucket: stats.dist.crossPlatform },
              { label: "Windows only", bucket: stats.dist.windowsOnly },
              { label: "Mac only", bucket: stats.dist.macOnly },
            ]}
          />
          <BarSection
            title="Rhino Version Support"
            weight={weight}
            total={distTotals}
            note={`Rhino 8 ready: ${share(stats.dist.rhino8.count, stats.totalPackages)}% of packages · ${share(stats.dist.rhino8.downloads, stats.totalDownloads)}% of downloads`}
            rows={[
              { label: "Rhino 6", bucket: stats.dist.rhino6 },
              { label: "Rhino 7", bucket: stats.dist.rhino7 },
              { label: "Rhino 8", bucket: stats.dist.rhino8 },
              { label: "Rhino 9 (WIP)", bucket: stats.dist.rhino9 },
            ]}
          />
        </div>
      </section>

      {/* Directory growth */}
      {growth && (
        <section aria-labelledby="stats-growth" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2
            id="stats-growth"
            className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
          >
            Directory Growth
          </h2>
          <LineChart
            values={growth.values}
            labels={growth.labels}
            unit="packages"
            startLabel={growth.start}
            endLabel={growth.end}
            ticks={growth.ticks}
          />
        </section>
      )}

      {/* Ecosystem downloads over time (accumulating snapshots) */}
      {totals && totals.length >= 2 && (
        <section aria-labelledby="stats-totals" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2
            id="stats-totals"
            className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
          >
            Total Downloads Over Time
          </h2>
          <LineChart
            values={totals.map((t) => t.downloads)}
            labels={totals.map((t) => formatDay(t.date))}
            dates={totals.map((t) => t.date)}
            unit="downloads"
            startLabel={formatDay(totals[0].date)}
            endLabel={formatDay(totals[totals.length - 1].date)}
          />
        </section>
      )}

      {/* Author leaderboard */}
      <section aria-labelledby="stats-authors">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h2
              id="stats-authors"
              className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
            >
              Top Authors by Downloads
            </h2>
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Published and credited packages combined
            </span>
          </div>
          <TableSearch
            id="author-filter"
            label="Filter authors"
            placeholder={`Search ${rankedAuthors.length.toLocaleString("en-US")} authors...`}
            value={authorQuery}
            onChange={updateAuthorQuery}
          />
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
            <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-600 dark:bg-zinc-800/50 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-2 py-2 sm:px-4">#</th>
                <th scope="col" className="w-full px-2 py-2 sm:px-4">Author</th>
                <th scope="col" className="px-2 py-2 text-right sm:px-4">Packages</th>
                <th scope="col" className="px-2 py-2 text-right sm:px-4">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50">
              {visibleAuthors.map((author) => (
                <tr key={author.rank} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                  <td className="px-2 py-2 text-xs tabular-nums text-gray-500 dark:text-zinc-400 sm:px-4">
                    {author.rank}
                  </td>
                  <td className="break-long-words px-2 py-2 sm:px-4">
                    {author.href ? (
                      <a
                        href={author.href}
                        className="pkg-quiet-link font-medium text-gray-900 dark:text-zinc-100"
                      >
                        {author.name}
                      </a>
                    ) : (
                      <>
                        <span className="font-medium text-gray-900 dark:text-zinc-100">{author.name}</span>
                        {author.soloPackageId && (
                          <>
                            {" "}· <a href={packagePath(author.soloPackageId)} className="pkg-link">{author.soloPackageId}</a>
                          </>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums sm:px-4">{author.packages.toLocaleString("en-US")}</td>
                  <td className="px-2 py-2 text-right tabular-nums sm:px-4">{author.downloads.toLocaleString("en-US")}</td>
                </tr>
              ))}
              {visibleAuthors.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                    No authors match &quot;{authorQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          <a href="/authors" className="pkg-link">All authors A–Z →</a>
        </p>
      </section>

      {/* Weekly movers */}
      {moversAll.length > 0 && (
        <section aria-labelledby="stats-movers">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <h2
                id="stats-movers"
                className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
              >
                Weekly Movers
              </h2>
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Most downloads in the last 7 days
              </span>
            </div>
            <TableSearch
              id="movers-filter"
              label="Filter weekly movers"
              placeholder={`Search ${moversAll.length.toLocaleString("en-US")} packages...`}
              value={moversQuery}
              onChange={updateMoversQuery}
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
              <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-2 py-2 sm:px-4">#</th>
                  <th scope="col" className="w-full px-2 py-2 sm:px-4">Package</th>
                  <th scope="col" className="px-2 py-2 text-right sm:px-4">This Week</th>
                  <th scope="col" className="hidden px-4 py-2 text-right sm:table-cell">This Month</th>
                  <th scope="col" className="px-2 py-2 text-right sm:px-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50">
                {movers.map(({ pkg, rank }) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                    <td className="px-2 py-2 text-xs tabular-nums text-gray-500 dark:text-zinc-400 sm:px-4">{rank}</td>
                    <td className="max-w-0 px-2 py-0 sm:px-4">
                      <a
                        href={packagePath(pkg.id)}
                        title={`Show ${pkg.id}`}
                        className="flex items-center gap-2 py-2.5 font-medium text-gray-900 transition-colors hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400 sm:py-2"
                      >
                        <PackageThumb pkg={pkg} />
                        <span className="truncate">{pkg.id}</span>
                      </a>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-brand-600 dark:text-brand-400 sm:px-4">
                      +{(pkg.downloadsWeek ?? 0).toLocaleString("en-US")}
                    </td>
                    <td className="hidden px-4 py-2 text-right tabular-nums sm:table-cell">
                      {(pkg.downloadsMonth ?? 0) > 0 ? `+${(pkg.downloadsMonth ?? 0).toLocaleString("en-US")}` : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums sm:px-4">{pkg.downloads.toLocaleString("en-US")}</td>
                  </tr>
                ))}
                {movers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                      No packages match &quot;{moversQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            <a href="/?sort=2" className="pkg-link">See all trending packages →</a>
          </p>
        </section>
      )}

      {/* Rising stars */}
      {risingAll.length > 0 && (
        <section aria-labelledby="stats-rising">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <h2
                id="stats-rising"
                className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
              >
                Rising Stars
              </h2>
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Highest share of lifetime downloads earned this week
              </span>
            </div>
            <TableSearch
              id="rising-filter"
              label="Filter rising packages"
              placeholder={`Search ${risingAll.length.toLocaleString("en-US")} packages...`}
              value={risingQuery}
              onChange={updateRisingQuery}
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
              <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-2 py-2 sm:px-4">#</th>
                  <th scope="col" className="w-full px-2 py-2 sm:px-4">Package</th>
                  <th scope="col" className="px-2 py-2 text-right sm:px-4">This Week</th>
                  <th scope="col" className="hidden px-4 py-2 text-right sm:table-cell">Total</th>
                  <th scope="col" className="px-2 py-2 text-right sm:px-4">Momentum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50">
                {risingStars.map(({ pkg, ratio, rank }) => (
                  <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                    <td className="px-2 py-2 text-xs tabular-nums text-gray-500 dark:text-zinc-400 sm:px-4">{rank}</td>
                    <td className="max-w-0 px-2 py-0 sm:px-4">
                      <a
                        href={packagePath(pkg.id)}
                        title={`Show ${pkg.id}`}
                        className="flex items-center gap-2 py-2.5 font-medium text-gray-900 transition-colors hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400 sm:py-2"
                      >
                        <PackageThumb pkg={pkg} />
                        <span className="truncate">{pkg.id}</span>
                      </a>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-brand-600 dark:text-brand-400 sm:px-4">
                      +{(pkg.downloadsWeek ?? 0).toLocaleString("en-US")}
                    </td>
                    <td className="hidden px-4 py-2 text-right tabular-nums sm:table-cell">{pkg.downloads.toLocaleString("en-US")}</td>
                    <td className="px-2 py-2 text-right tabular-nums sm:px-4" title="Share of lifetime downloads earned in the last 7 days">
                      {(ratio * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {risingStars.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                      No packages match &quot;{risingQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            <a href="/?sort=3" className="pkg-link">See all rising packages →</a>
          </p>
        </section>
      )}

      {/* New packages */}
      {stats.newThisMonth.length > 0 && (
        <section aria-labelledby="stats-new">
          <h2
            id="stats-new"
            className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
          >
            New This Month ({stats.newThisMonth.length.toLocaleString("en-US")})
          </h2>
          <RecentList packages={stats.newThisMonth.slice(0, 15)} dateOf={(pkg) => pkg.firstReleased!} />
          {stats.newThisMonth.length > 15 && (
            <details className="mt-3">
              <summary className="pkg-link cursor-pointer text-sm">
                Show all {stats.newThisMonth.length.toLocaleString("en-US")}
              </summary>
              <div className="mt-3">
                <RecentList packages={stats.newThisMonth.slice(15)} dateOf={(pkg) => pkg.firstReleased!} />
              </div>
            </details>
          )}
        </section>
      )}

      {/* Updated packages, excluding anything already listed as new above */}
      {stats.updatedThisMonthCount > 0 && (
        <section aria-labelledby="stats-updated">
          <div className="mb-3 flex flex-col gap-0.5">
            <h2
              id="stats-updated"
              className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
            >
              Updated This Month ({stats.updatedThisMonthCount.toLocaleString("en-US")})
            </h2>
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Not counting the new packages above
            </span>
          </div>
          <RecentList packages={stats.updatedThisMonthList} dateOf={(pkg) => latestRelease(pkg)} />
          <p className="mt-3 text-sm">
            <a href="/?sort=1" className="pkg-link">See all latest updates →</a>
          </p>
        </section>
      )}
    </div>
  );
}

/** Packages as link rows with one date each. */
function RecentList({ packages, dateOf }: { packages: Package[]; dateOf: (pkg: Package) => string | Date }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <li key={pkg.id}>
          <a
            href={packagePath(pkg.id)}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:border-brand-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-brand-700"
          >
            <span className="flex min-w-0 items-center gap-2">
              <PackageThumb pkg={pkg} />
              <span className="truncate font-medium text-gray-900 dark:text-zinc-100">{pkg.id}</span>
            </span>
            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-zinc-400">
              {formatDate(dateOf(pkg))}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

interface ChartTick {
  position: number; // 0..1 along the x axis
  label: string;
}

function LineChart({
  values,
  startLabel,
  endLabel,
  ticks = [],
  labels = [],
  dates,
  unit = "",
}: {
  values: number[];
  startLabel: string;
  endLabel: string;
  ticks?: ChartTick[];
  labels?: string[];
  /** Point dates, for series whose samples are not evenly spaced in time. */
  dates?: string[];
  unit?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 600;
  const height = 140;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const positions = dates
    ? timePositions(dates)
    : values.map((_, i) => (values.length > 1 ? i / (values.length - 1) : 0));

  const coords = values.map((v, i) => ({
    x: positions[i] * width,
    y: height - 6 - ((v - min) / span) * (height - 12),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverIndex(nearestIndex(positions, ratio));
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative" onMouseMove={onMouseMove} onMouseLeave={() => setHoverIndex(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full"
        role="img"
        aria-label={`Chart from ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")}`}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            y1={height - 6 - f * (height - 12)}
            x2={width}
            y2={height - 6 - f * (height - 12)}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-gray-200 dark:stroke-zinc-800"
          />
        ))}
        {ticks.map((tick) => (
          <line
            key={tick.label}
            x1={tick.position * width}
            y1={0}
            x2={tick.position * width}
            y2={height}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-gray-100 dark:stroke-zinc-800/60"
          />
        ))}
        <path d={area} className="fill-brand-500/10 dark:fill-brand-400/10" />
        <path
          d={line}
          fill="none"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="stroke-brand-500 dark:stroke-brand-400"
        />
        {hoverIndex !== null && (
          <line
            x1={coords[hoverIndex].x}
            y1={0}
            x2={coords[hoverIndex].x}
            y2={height}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-gray-400 dark:stroke-zinc-500"
          />
        )}
      </svg>
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow dark:bg-zinc-100 dark:text-zinc-900"
          style={{ left: `${Math.min(92, Math.max(8, (coords[hoverIndex].x / width) * 100))}%` }}
        >
          {labels[hoverIndex] ? `${labels[hoverIndex]} · ` : ""}
          {values[hoverIndex].toLocaleString("en-US")}
          {unit ? ` ${unit}` : ""}
        </div>
      )}
      </div>
      {ticks.length > 0 && (
        <div className="relative h-4 text-[10px] tabular-nums text-gray-500 dark:text-zinc-400">
          {ticks.map((tick) => (
            <span
              key={tick.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${tick.position * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      )}
      {/* On narrow phones the three labels have no room side by side, so the
          range drops to its own line instead of colliding with the dates. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs tabular-nums text-gray-500 dark:text-zinc-400">
        <span>{startLabel}</span>
        <span className="order-last w-full text-center xs:order-none xs:w-auto xs:text-left">
          {min.toLocaleString("en-US")} → {max.toLocaleString("en-US")}
        </span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}

interface Bucket {
  count: number;
  downloads: number;
}

type Weight = "packages" | "downloads";

function share(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function PackageThumb({ pkg }: { pkg: Package }) {
  return <PackageIcon className="h-5 w-5 flex-shrink-0 rounded-sm" src={pkg.iconUrl} size={20} />;
}

function TableSearch({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="group relative flex w-full sm:w-64">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon
          className="h-4 w-4 text-gray-400 transition-colors group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400"
          aria-hidden="true"
        />
      </div>
      <input
        id={id}
        type="text"
        spellCheck={false}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border-0 bg-white py-2.5 pl-9 pr-3 text-base sm:py-1.5 sm:text-sm text-gray-900 ring-1 ring-inset ring-gray-300 transition-shadow placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-400 dark:focus:ring-brand-500"
      />
    </div>
  );
}

function StatTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className={`text-xl font-bold ${accent ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-zinc-100"}`}>
        {value}
      </dd>
    </div>
  );
}

function BarSection({
  title,
  rows,
  total,
  weight,
  note,
}: {
  title: string;
  rows: { label: string; bucket: Bucket }[];
  total: { packages: number; downloads: number };
  weight: Weight;
  note?: string;
}) {
  const denominator = weight === "packages" ? total.packages : total.downloads;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
        {title}
      </h3>
      {note && <p className="mb-3 mt-1 text-xs text-gray-500 dark:text-zinc-400">{note}</p>}
      <ul className={`flex flex-col gap-3 ${note ? "" : "mt-3"}`}>
        {rows.map((row) => {
          const value = weight === "packages" ? row.bucket.count : row.bucket.downloads;
          const percent = share(value, denominator);
          return (
            <li key={row.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-zinc-300">{row.label}</span>
                <span className="tabular-nums text-gray-500 dark:text-zinc-400">
                  {weight === "downloads" ? compactNumber(value) : value.toLocaleString("en-US")} · {percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300 dark:bg-brand-600"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function getStats(cache: Package[]) {
  if (cache.length === 0) return null;

  const now = Date.now();
  const monthMs = 30 * 24 * 3600 * 1000;

  let totalDownloads = 0;
  let weeklyDownloads = 0;

  // Every bucket tracks packages and downloads so the bars can be shown
  // either way: counting packages lets long-dead ones drown out the few
  // that everybody actually installs.
  const bucket = (): Bucket => ({ count: 0, downloads: 0 });
  const dist = {
    grasshopper: bucket(),
    rhino: bucket(),
    bothTypes: bucket(),
    crossPlatform: bucket(),
    windowsOnly: bucket(),
    macOnly: bucket(),
    rhino6: bucket(),
    rhino7: bucket(),
    rhino8: bucket(),
    rhino9: bucket(),
  };

  const add = (b: Bucket, pkg: Package) => {
    b.count++;
    b.downloads += pkg.downloads;
  };

  const newThisMonth: Package[] = [];
  const updatedThisMonthList: Package[] = [];

  for (const pkg of cache) {
    totalDownloads += pkg.downloads;
    weeklyDownloads += pkg.downloadsWeek ?? 0;

    // A package's first version also counts as an "update" the day it
    // ships, so a brand-new package would otherwise show up in both lists.
    // Keep them mutually exclusive: something first released this month
    // belongs in "New", not "Updated".
    const isNewThisMonth =
      !!pkg.firstReleased && now - new Date(pkg.firstReleased).getTime() <= monthMs;
    if (isNewThisMonth) {
      newThisMonth.push(pkg);
    } else if (now - latestRelease(pkg).getTime() <= monthMs) {
      updatedThisMonthList.push(pkg);
    }

    const isGh = has(Filters.Grasshopper, pkg);
    const isRh = has(Filters.Rhino, pkg);
    if (isGh && isRh) add(dist.bothTypes, pkg);
    else if (isGh) add(dist.grasshopper, pkg);
    else if (isRh) add(dist.rhino, pkg);

    const win = has(Filters.Windows, pkg);
    const mac = has(Filters.Mac, pkg);
    if (win && mac) add(dist.crossPlatform, pkg);
    else if (win) add(dist.windowsOnly, pkg);
    else if (mac) add(dist.macOnly, pkg);

    if (has(Filters.Rhino6, pkg)) add(dist.rhino6, pkg);
    if (has(Filters.Rhino7, pkg)) add(dist.rhino7, pkg);
    if (has(Filters.Rhino8, pkg)) add(dist.rhino8, pkg);
    if (has(Filters.Rhino9, pkg)) add(dist.rhino9, pkg);
  }

  newThisMonth.sort(
    (a, b) => new Date(b.firstReleased!).getTime() - new Date(a.firstReleased!).getTime(),
  );
  updatedThisMonthList.sort((a, b) => latestRelease(b).getTime() - latestRelease(a).getTime());

  return {
    totalPackages: cache.length,
    totalDownloads,
    weeklyDownloads,
    dist,
    // The headings show the full counts; the updated list is capped (the new
    // list shows its first rows and tucks the rest behind a toggle).
    newThisMonth,
    updatedThisMonthCount: updatedThisMonthList.length,
    updatedThisMonthList: updatedThisMonthList.slice(0, 15),
  };
}
