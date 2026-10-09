import type { Metadata } from "next";
import Link from "next/link";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import NotFoundSearch from "@/app/_components/NotFoundSearch";

export const metadata: Metadata = {
  title: "Page not found",
  // Served for any address that does not exist; nothing here is worth indexing.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto mt-12 flex max-w-lg flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center sm:p-12 dark:border-zinc-700 dark:bg-zinc-900/40">
      <DocumentMagnifyingGlassIcon
        className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500"
        aria-hidden="true"
      />
      <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved, or the address
        might be misspelled. Try searching for it instead.
      </p>
      <NotFoundSearch />
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
        >
          Return to directory
        </Link>
      </div>
    </div>
  );
}
