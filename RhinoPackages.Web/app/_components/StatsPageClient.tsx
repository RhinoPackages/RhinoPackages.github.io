"use client";

import { Filters, Package, has, useApi } from "@/app/_components/api";
import { useMemo } from "react";
import Link from "next/link";
import Spinner from "./Spinner";

export default function StatsPageClient({ initialCache = [] }: { initialCache?: Package[] }) {
  const { cache, status } = useApi(initialCache);
  const stats = useMemo(() => getStats(cache), [cache]);

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
        <h3 className="mt-4 text-sm font-semibold text-red-800 dark:text-red-300">
          Error loading statistics
        </h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">{status.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Headline numbers */}
      <section aria-labelledby="stats-overview">
        <h2 id="stats-overview" className="sr-only">
          Overview
        </h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Packages" value={stats.totalPackages.toLocaleString()} />
          <StatTile label="Total Downloads" value={stats.totalDownloads.toLocaleString()} />
          <StatTile
            label="Downloads / Week"
            value={stats.weeklyDownloads > 0 ? stats.weeklyDownloads.toLocaleString() : "—"}
            accent
          />
          <StatTile label="New This Month" value={stats.newThisMonth.length.toLocaleString()} />
          <StatTile label="Updated This Month" value={stats.updatedThisMonth.toLocaleString()} />
          <StatTile label="Last Updated" value={stats.lastUpdated} small />
        </dl>
      </section>

      {/* Distribution bars */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <BarSection
          title="Plugin Type"
          rows={[
            { label: "Grasshopper", count: stats.grasshopper },
            { label: "Rhino", count: stats.rhino },
            { label: "Both", count: stats.bothTypes },
          ]}
          total={stats.totalPackages}
        />
        <BarSection
          title="Platform Support"
          rows={[
            { label: "Cross-platform", count: stats.crossPlatform },
            { label: "Windows only", count: stats.windowsOnly },
            { label: "Mac only", count: stats.macOnly },
          ]}
          total={stats.totalPackages}
        />
        <BarSection
          title="Rhino Version Support"
          rows={[
            { label: "Rhino 6", count: stats.rhino6 },
            { label: "Rhino 7", count: stats.rhino7 },
            { label: "Rhino 8", count: stats.rhino8 },
            { label: "Rhino 9 (WIP)", count: stats.rhino9 },
          ]}
          total={stats.totalPackages}
        />
      </div>

      {/* Author leaderboard */}
      <section aria-labelledby="stats-authors">
        <h2
          id="stats-authors"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500"
        >
          Top Authors by Downloads
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
            <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-500 dark:bg-zinc-800/50 dark:text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-2">#</th>
                <th scope="col" className="px-4 py-2">Author</th>
                <th scope="col" className="px-4 py-2 text-right">Packages</th>
                <th scope="col" className="px-4 py-2 text-right">Downloads</th>
                <th scope="col" className="px-4 py-2 text-right">This Week</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50">
              {stats.topAuthors.map((author, i) => (
                <tr key={author.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2 text-xs tabular-nums text-gray-400 dark:text-zinc-500">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/?owner=${author.id}`}
                      className="font-medium text-gray-900 transition-colors hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400"
                    >
                      {author.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{author.packages.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{author.downloads.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-brand-600 dark:text-brand-400">
                    {author.weekly > 0 ? `+${author.weekly.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* New packages */}
      {stats.newThisMonth.length > 0 && (
        <section aria-labelledby="stats-new">
          <h2
            id="stats-new"
            className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500"
          >
            New This Month
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.newThisMonth.map((pkg) => (
              <li key={pkg.id}>
                <Link
                  href={`/?p=${encodeURIComponent(pkg.id)}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:border-brand-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-brand-700"
                >
                  <span className="truncate font-medium text-gray-900 dark:text-zinc-100">{pkg.id}</span>
                  <span className="flex-shrink-0 text-xs text-gray-500 dark:text-zinc-400">
                    {pkg.firstReleased ? new Date(pkg.firstReleased).toLocaleDateString() : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = false,
  small = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
        {label}
      </dt>
      <dd
        className={`font-bold ${small ? "text-sm" : "text-xl"} ${
          accent ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function BarSection({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;
          return (
            <li key={row.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-zinc-300">{row.label}</span>
                <span className="tabular-nums text-gray-500 dark:text-zinc-400">
                  {row.count.toLocaleString()} · {percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-brand-500 dark:bg-brand-600"
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

interface AuthorStats {
  id: number;
  name: string;
  packages: number;
  downloads: number;
  weekly: number;
}

function getStats(cache: Package[]) {
  if (cache.length === 0) return null;

  const now = Date.now();
  const monthMs = 30 * 24 * 3600 * 1000;

  let totalDownloads = 0;
  let weeklyDownloads = 0;
  let updatedThisMonth = 0;
  let grasshopper = 0;
  let rhino = 0;
  let bothTypes = 0;
  let windowsOnly = 0;
  let macOnly = 0;
  let crossPlatform = 0;
  let rhino6 = 0;
  let rhino7 = 0;
  let rhino8 = 0;
  let rhino9 = 0;
  let lastUpdated = cache[0].updated;

  const authors = new Map<number, AuthorStats>();
  const newThisMonth: Package[] = [];

  for (const pkg of cache) {
    totalDownloads += pkg.downloads;
    weeklyDownloads += pkg.downloadsWeek ?? 0;

    if (pkg.updated > lastUpdated) lastUpdated = pkg.updated;
    if (now - new Date(pkg.updated).getTime() <= monthMs) updatedThisMonth++;
    if (pkg.firstReleased && now - new Date(pkg.firstReleased).getTime() <= monthMs) {
      newThisMonth.push(pkg);
    }

    const isGh = has(Filters.Grasshopper, pkg);
    const isRh = has(Filters.Rhino, pkg);
    if (isGh && isRh) bothTypes++;
    else if (isGh) grasshopper++;
    else if (isRh) rhino++;

    const win = has(Filters.Windows, pkg);
    const mac = has(Filters.Mac, pkg);
    if (win && mac) crossPlatform++;
    else if (win) windowsOnly++;
    else if (mac) macOnly++;

    if (has(Filters.Rhino6, pkg)) rhino6++;
    if (has(Filters.Rhino7, pkg)) rhino7++;
    if (has(Filters.Rhino8, pkg)) rhino8++;
    if (has(Filters.Rhino9, pkg)) rhino9++;

    for (const owner of pkg.owners) {
      const entry = authors.get(owner.id) ?? {
        id: owner.id,
        name: owner.name,
        packages: 0,
        downloads: 0,
        weekly: 0,
      };
      entry.packages++;
      entry.downloads += pkg.downloads;
      entry.weekly += pkg.downloadsWeek ?? 0;
      authors.set(owner.id, entry);
    }
  }

  const topAuthors = Array.from(authors.values())
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 15);

  newThisMonth.sort(
    (a, b) => new Date(b.firstReleased!).getTime() - new Date(a.firstReleased!).getTime(),
  );

  return {
    totalPackages: cache.length,
    totalDownloads,
    weeklyDownloads,
    updatedThisMonth,
    lastUpdated: new Date(lastUpdated).toLocaleDateString(),
    grasshopper,
    rhino,
    bothTypes,
    windowsOnly,
    macOnly,
    crossPlatform,
    rhino6,
    rhino7,
    rhino8,
    rhino9,
    topAuthors,
    newThisMonth: newThisMonth.slice(0, 12),
  };
}
