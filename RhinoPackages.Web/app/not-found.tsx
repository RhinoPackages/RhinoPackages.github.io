import Link from "next/link";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="mx-auto mt-12 flex max-w-lg flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
      <DocumentMagnifyingGlassIcon
        className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500"
        aria-hidden="true"
      />
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">
        Page Not Found
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
        >
          Return to homepage
        </Link>
      </div>
    </div>
  );
}
