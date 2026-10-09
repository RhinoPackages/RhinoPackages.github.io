"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { packagePath } from "@/app/_components/packageInfo";

/**
 * What the missing URL was probably after: its last path segment (a mistyped
 * package id, usually), decoded when it can be. A path like /package/%E0%A4
 * is not valid UTF-8, so it falls back to the raw segment instead of throwing.
 *
 * GitHub Pages serves /package/<id>/ (trailing slash) from this 404, because
 * the export only has package/<id>.html. That case also gets a direct link to
 * the package page.
 */
function readPath(pathname: string | null) {
  const path = pathname ?? "";
  const parts = path.split("/").filter(Boolean);
  const raw = parts.pop() ?? "";
  let segment = raw;
  let decoded = true;
  try {
    segment = decodeURIComponent(raw);
  } catch {
    decoded = false;
  }
  const trailingSlash = decoded && path.endsWith("/") && parts.length === 1 && parts[0] === "package";
  return { segment, packageHref: trailingSlash ? packagePath(segment) : null };
}

/**
 * Search field for the 404 page, prefilled from the missing URL. It is a plain
 * GET form to /?search=, so it works before (and without) hydration. The
 * prefill waits for the browser: the prerendered 404 has no real path.
 */
export default function NotFoundSearch() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [packageHref, setPackageHref] = useState<string | null>(null);

  useEffect(() => {
    const path = readPath(pathname);
    setQuery(path.segment);
    setPackageHref(path.packageHref);
  }, [pathname]);

  return (
    <>
      <form action="/" method="get" role="search" className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
        <label htmlFor="not-found-search" className="sr-only">
          Search packages
        </label>
        <input
          id="not-found-search"
          name="search"
          type="text"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search packages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full min-w-0 rounded-md border-0 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:ring-zinc-700 dark:focus:ring-brand-500"
        />
        <button type="submit" className="pkg-button justify-center">
          Search
        </button>
      </form>
      {packageHref && (
        <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400">
          Looking for a package page? Try{" "}
          <a href={packageHref} className="pkg-link break-long-words">
            {packageHref}
          </a>{" "}
          without the trailing slash.
        </p>
      )}
    </>
  );
}
