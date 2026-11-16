"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-20 flex max-w-md flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 p-8 text-center shadow-sm dark:border-red-900/30 dark:bg-red-950/20">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">This page failed to load</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        The directory hit an error while drawing this page. Try again, or browse the A–Z list instead.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-700 dark:hover:bg-red-600"
        >
          Try again
        </button>
        <a href="/packages" className="pkg-link text-sm font-medium">
          Browse all packages →
        </a>
      </div>
    </div>
  );
}
