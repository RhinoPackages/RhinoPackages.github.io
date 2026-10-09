"use client";

import { usePathname } from "next/navigation";

// The before: box makes the icon-only phone links 44px tall to tap without
// widening them (the header has no room for more) or changing how they look.
const linkClasses =
  "relative flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm font-medium transition-colors before:absolute before:inset-x-0 before:-inset-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 sm:px-3 sm:before:hidden";

// The current page reads like a hovered link that stays put.
const idleClasses =
  "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
const currentClasses = "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100";

/**
 * A header link that knows where the visitor is. The page itself is
 * aria-current="page"; a page that belongs to the link's section (a package
 * under "All packages", an author under "Authors") is aria-current="true".
 * Both look the same. Section pages keep "page" for their own breadcrumb.
 *
 * Icon and label arrive as children, so they stay server-rendered. A plain
 * <a> on purpose: the pages are static files and nothing here needs prefetching.
 */
export default function NavLink({
  href,
  section,
  title,
  children,
}: {
  href: string;
  /** Path prefix of the pages that belong to this link, e.g. "/package/". */
  section?: string;
  title: string;
  children: React.ReactNode;
}) {
  // A trailing slash (/packages/) is the same page.
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");
  const current = pathname === href ? "page" : section && pathname.startsWith(section) ? "true" : undefined;

  return (
    <a
      href={href}
      title={title}
      aria-current={current}
      className={`${linkClasses} ${current ? currentClasses : idleClasses}`}
    >
      {children}
    </a>
  );
}
