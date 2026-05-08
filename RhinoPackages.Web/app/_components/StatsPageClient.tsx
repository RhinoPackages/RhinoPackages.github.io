"use client";

import { Filters, Package, has, useApi } from "@/app/_components/api";
import { useMemo } from "react";
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

  if (status.isError && cache.length === 0) {
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
    <dl className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800">
      {Object.entries(stats).map(([key, value]) => (
        <div key={key} className="grid grid-cols-2 gap-4 py-2">
          <dt className="text-right text-sm font-medium text-gray-900 dark:text-zinc-100">{key}</dt>
          <dd className="text-sm text-gray-700 dark:text-zinc-300">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function getStats(cache: Package[]): Record<string, string> {
  function count(filter: Filters) {
    const count = cache.filter((pkg) => has(filter, pkg)).length;
    return count.toLocaleString();
  }

  if (cache.length === 0) return {};

  let lastUpdated = cache.reduce((prev, curr) =>
    prev.updated > curr.updated ? prev : curr,
  ).updated;
  lastUpdated = new Date(lastUpdated).toLocaleString();

  return {
    "Last updated": lastUpdated,
    "Number of packages": cache.length.toLocaleString(),
    "Grasshopper plugins": count(Filters.Grasshopper),
    "Rhino plugins": count(Filters.Rhino),
  };
}
