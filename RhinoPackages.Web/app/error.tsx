"use client";

import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

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
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
        <XMarkIcon className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">Something went wrong</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        We encountered an error while loading the application.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-700 dark:hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  );
}
