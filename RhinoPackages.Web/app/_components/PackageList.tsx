import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  CheckIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  StarIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { pageResults, Filters, Package, formatDate, isMaintained, latestRelease } from "@/app/_components/api";
import { displayKeywords, formatBytes, packagePath, parseWebsiteAction } from "./packageInfo";
import { Params, usePackageContext, defaultParams, hasActiveFilters } from "./PackageContext";
import PackageIcon from "./PackageIcon";
import Spinner from "./Spinner";

export default function PackageList() {
  const { controls, packages, filteredCount, navigate, stats, status, ownerSummary } =
    usePackageContext();
  const expandedId = controls.p ?? null;
  const showHeaderLoading = status.isLoading && packages.length > 0;

  const disablePagination = packages.length === 0 || (controls.page === 0 && packages.length !== pageResults);

  const hasFilters = hasActiveFilters(controls);

  // A ?p= deep link expands its package but leaves the reader at the top of
  // the page, with the card itself often thousands of pixels down. Bring it
  // into view once it has rendered. Captured at mount so that expanding a
  // card by hand later, which also writes ?p=, never moves the page.
  const deepLinkTarget = useRef(controls.p);
  const hasScrolledToDeepLink = useRef(false);

  useEffect(() => {
    const id = deepLinkTarget.current;
    if (!id || hasScrolledToDeepLink.current) return;

    const card = document.getElementById(packageAnchorId(id));
    if (!card) return; // Still loading, or the id matches no package.

    hasScrolledToDeepLink.current = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [packages]);

  return (
    <div className="flex min-w-0 w-full flex-col">
      {/* Author profile header, shown when filtering by a single author */}
      {ownerSummary && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-800/60 dark:bg-brand-900/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-brand-500 dark:text-brand-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                {ownerSummary.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate({ owner: undefined })}
              className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Clear author filter
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4 lg:grid-cols-5">
            <OwnerStat label="Packages" value={ownerSummary.packages.toLocaleString()} />
            <OwnerStat
              label="Owned / Credited"
              value={`${ownerSummary.owned.toLocaleString()} / ${ownerSummary.credited.toLocaleString()}`}
            />
            <OwnerStat label="Downloads" value={ownerSummary.downloads.toLocaleString()} />
            <OwnerStat
              label="This Week"
              value={ownerSummary.weekly > 0 ? `+${ownerSummary.weekly.toLocaleString()}` : "—"}
              accent
            />
            <OwnerStat
              label="Last Release"
              value={ownerSummary.lastUpdated ? formatDate(ownerSummary.lastUpdated) : "—"}
              hint={
                ownerSummary.firstReleased
                  ? `Publishing since ${formatDate(ownerSummary.firstReleased)}`
                  : undefined
              }
            />
          </dl>
        </div>
      )}

      {/* Stats Banner / Header */}
      <div className="mt-4 mb-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-center">
        <div>
          <div className="flex min-h-8 items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
              Packages Directory
            </h2>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
              {showHeaderLoading && <Spinner />}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400" aria-live="polite" aria-atomic="true">
            {status.isLoading
              ? "Loading packages..."
              : status.isError
                ? "Failed to load packages."
                : packages.length === 0
                  ? "No packages found matching your criteria."
                  : `Showing ${packages.length} of ${filteredCount} packages`}
          </p>
          {/* The keyword chips live on the cards, so without this the only
              cue that a tag is filtering the list is the URL. */}
          {controls.tag && (
            <button
              type="button"
              onClick={() => navigate({ tag: undefined })}
              title={`Remove keyword filter: ${controls.tag}`}
              aria-label={`Remove keyword filter: ${controls.tag}`}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-500/30 transition-colors hover:bg-brand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-400/30 dark:hover:bg-brand-900/60 dark:focus-visible:ring-brand-400"
            >
              Keyword: {controls.tag}
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <a
          href="/stats"
          title="View full directory statistics"
          className="group hidden divide-x divide-gray-200 rounded-md text-sm transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:divide-zinc-800 dark:focus-visible:ring-brand-400 lg:flex"
        >
          <div className="flex flex-col pr-4">
            <span className="text-gray-500 dark:text-zinc-400">Total Packages</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{stats?.totalPackages.toLocaleString() ?? "-"}</span>
          </div>
          <div className="flex flex-col px-4">
            <span className="text-gray-500 dark:text-zinc-400">Total Downloads</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{stats?.totalDownloads.toLocaleString() ?? "-"}</span>
          </div>
          {(stats?.weeklyDownloads ?? 0) > 0 && (
            <div className="flex flex-col px-4">
              <span className="text-gray-500 dark:text-zinc-400">This Week</span>
              <span className="font-semibold text-gray-900 dark:text-zinc-100">{stats.weeklyDownloads.toLocaleString()}</span>
            </div>
          )}
          <div className="flex flex-col pl-4">
            <span className="text-gray-500 dark:text-zinc-400">Updated Monthly</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">{stats?.recentUpdates.toLocaleString() ?? "-"}</span>
          </div>
        </a>
      </div>

      {packages.length === 0 && status.isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40" aria-live="polite" aria-busy="true">
          <Spinner />
          <p className="mt-4 text-sm font-medium text-gray-500 dark:text-zinc-400">Loading directory data...</p>
        </div>
      ) : packages.length === 0 && status.isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 p-12 text-center dark:border-red-900/50 dark:bg-red-950/20" role="alert" aria-live="assertive">
          <svg className="mx-auto h-12 w-12 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-red-800 dark:text-red-300">Error loading packages</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">{status.message}</p>
        </div>
      ) : packages.length === 0 && status.isIdle ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500" aria-hidden="true" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {controls.search
              ? `No results for "${controls.search}"`
              : controls.tag
                ? `No packages tagged "${controls.tag}"`
                : "No packages found"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {controls.search ? "Check for typos or try adjusting your search and filters." : "Try adjusting your search or filters to find what you're looking for."}
          </p>
          {hasFilters && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  navigate(defaultParams);
                  document.getElementById("main-content")?.focus({ preventScroll: true });
                }}
                className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul role="list" className="flex flex-grow flex-col gap-5">
          {packages.map((pkg) => {
            return (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isExpanded={expandedId === pkg.id}
                navigate={navigate}
                controls={controls}
              />
            );
          })}
        </ul>
      )}

      {/* Infinite Scroll Trigger */}
      {!disablePagination && (
        <InfiniteScrollTrigger onIntersect={() => navigate({ page: controls.page + 1 })} />
      )}
    </div>
  );
}

/** DOM id of a package card, used as the ?p= deep link scroll target. */
function packageAnchorId(packageId: string) {
  return `package-${packageId}`;
}

/** Most keyword chips the quick view shows; the package page lists them all. */
const quickViewKeywords = 10;

/** Longest license the quick view's fact line shows; longer ones are EULA text for the package page. */
const quickViewLicenseMax = 24;

function OwnerStat({
  label,
  value,
  accent = false,
  hint,
}: {
  label: string;
  value: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col" title={hint}>
      <dt className="text-xs text-gray-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`font-semibold ${
          accent ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-zinc-100"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function InfiniteScrollTrigger({ onIntersect }: { onIntersect: () => void }) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { controls, packages } = usePackageContext();
  const hasMore = packages.length >= (controls.page + 1) * pageResults;

  useEffect(() => {
    if (!ref || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoading(true);
          onIntersect();
          // Wait longer before allowing next load to ensure DOM update
          setTimeout(() => setIsLoading(false), 1500);
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // Load slightly before hitting bottom
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, onIntersect, isLoading, hasMore, controls.page]);

  return (
    <div
      ref={setRef}
      className="flex h-10 w-full items-center justify-center my-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {isLoading && <Spinner />}
    </div>
  );
}

const PackageCard = memo(function PackageCard({
  pkg,
  isExpanded,
  navigate,
  controls,
}: {
  pkg: Package;
  isExpanded: boolean;
  navigate: (value: { [Key in keyof Params]?: Params[Key] }) => void;
  controls: Params;
}) {
  const [copied, setCopied] = useState(false);
  const onToggle = () => {
    if (isExpanded) {
      // Collapsing removes the quick view's height. If the reader has scrolled
      // past the card's header, that height vanishes above them and the cards
      // below jump up. Pin the header to the top instead; it stays put while
      // the card shrinks beneath it.
      // The offset is the card's scroll-margin, which clears the phone's sticky search bar.
      const card = document.getElementById(packageAnchorId(pkg.id));
      const top = card?.getBoundingClientRect().top ?? 0;
      if (card && top < 0) {
        const margin = parseFloat(getComputedStyle(card).scrollMarginTop) || 0;
        window.scrollBy({ top: top - margin, behavior: "auto" });
      }
    }
    navigate({ p: isExpanded ? undefined : pkg.id });
  };

  // The canonical page address, so a pasted link lands on the package page
  // rather than on the list with this card open.
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}${packagePath(pkg.id)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function has(constant: Filters) {
    return constant === (pkg.filters & constant);
  }

  const { websiteHref, emailHref } = parseWebsiteAction(pkg.homepageUrl);

  const link = `rhino://package/search?name=${pkg.id}`;

  const keywords = displayKeywords(pkg);
  const shownKeywords = keywords.slice(0, quickViewKeywords);
  // Licenses are free text ("MIT", "MIT License", a pasted EULA). Show only the
  // short ones, and do not say "license" twice. The package page has the full text.
  const licenseText = pkg.license?.replace(/\s+/g, " ").trim();
  const license = licenseText && licenseText.length <= quickViewLicenseMax ? licenseText : null;
  // What the rows above do not say, from data.json alone. Any missing value
  // drops out of the line.
  const facts = [
    `v${pkg.version}`,
    pkg.firstReleased ? `first released ${formatDate(pkg.firstReleased)}` : null,
    pkg.sizeBytes ? formatBytes(pkg.sizeBytes) : null,
    license ? `${license}${/licen/i.test(license) ? "" : " license"}` : null,
  ].filter(Boolean);
  const date = formatDate(pkg.updated);
  const downloads = pkg.downloads.toLocaleString();
  const downloadsWeek = pkg.downloadsWeek ?? 0;

  const isTrending = downloadsWeek >= 30 && downloadsWeek > pkg.downloads * 0.01;
  const hasDescription =
    pkg.description.trim().length > 0 && pkg.description.trim().toLowerCase() !== "no description";
  const ageDays = pkg.firstReleased
    ? (Date.now() - new Date(pkg.firstReleased).getTime()) / (1000 * 3600 * 24)
    : null;
  const isNew = ageDays !== null && ageDays <= 30;
  // The same rule as the sidebar's Maintained filter and the package page.
  const maintained = isMaintained(pkg);
  // Nothing published for the current Rhino release. Packages that target
  // Rhino 9 only are forward-looking, not deprecated.
  const isDeprecated = !has(Filters.Rhino8) && !has(Filters.Rhino9);

  const supportedPlatformsList = [
    has(Filters.Windows) && "Windows",
    has(Filters.Mac) && "Mac",
    has(Filters.Rhino6) && "Rhino 6",
    has(Filters.Rhino7) && "Rhino 7",
    has(Filters.Rhino8) && "Rhino 8",
    has(Filters.Rhino9) && "Rhino 9 (WIP)",
    has(Filters.Rhino) && "Rhino plugin",
    has(Filters.Grasshopper) && "Grasshopper plugin",
  ].filter(Boolean);

  return (
    <li
      id={packageAnchorId(pkg.id)}
      className={`flex scroll-mt-20 flex-col md:scroll-mt-4 overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 dark:bg-zinc-900/40 md:p-6 ${isExpanded
        ? "border-brand-300 shadow-md dark:border-brand-700 dark:bg-zinc-900/80"
        : "border-gray-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-brand-700 dark:hover:bg-zinc-900/80"
        } p-4`}
    >
      {/* Stays stacked until there is room for the icon strip beside the
          title; side by side any earlier squeezes the name to one letter
          per line. */}
      <div
        className="mb-2 flex cursor-pointer flex-col gap-2 rounded-lg transition-shadow lg:flex-row lg:gap-0"
        onClick={onToggle}
      >
        <div className="flex min-w-0 flex-grow gap-x-4">
          <PackageIcon className="h-[2.5rem] w-[2.5rem]" src={pkg.iconUrl} size={40} />
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                aria-expanded={isExpanded}
                aria-controls={`package-details-${pkg.id}`}
                className="break-long-words rounded-sm text-left text-lg font-bold text-gray-900 transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-100 dark:hover:text-brand-400 dark:focus-visible:ring-brand-400"
              >
                {pkg.id}
              </button>
              {pkg.prerelease && (
                <span
                  title="Work in progress (Pre-release)"
                  className="rounded-full bg-yellow-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20"
                >
                  <span aria-hidden="true">wip</span>
                  <span className="sr-only">Pre-release</span>
                </span>
              )}
              {isNew && (
                <span
                  title="First released within the last 30 days"
                  className="rounded-full bg-green-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20"
                >
                  new
                </span>
              )}
              {isTrending && (
                <span
                  title={`Trending: ${downloadsWeek.toLocaleString()} downloads this week`}
                  className="rounded-full bg-orange-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-500/20"
                >
                  {/* Icon-only when other badges are present to avoid crowding the title row */}
                  <span aria-hidden="true">{pkg.prerelease || isNew ? "🔥" : "🔥 trending"}</span>
                  <span className="sr-only">Trending this week</span>
                </span>
              )}
              {isDeprecated && (
                <span
                  title="Deprecated: no build for the current Rhino release (Rhino 8)"
                  className="rounded-full bg-rose-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-500/20"
                >
                  deprecated
                </span>
              )}
              {!maintained && (
                <span
                  title={`Not actively maintained: no release since ${formatDate(latestRelease(pkg))}`}
                  className="rounded-full bg-amber-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/20"
                >
                  <span aria-hidden="true">inactive</span>
                  <span className="sr-only">Not actively maintained</span>
                </span>
              )}
              <p className="max-w-full break-all text-xs font-semibold text-gray-500 dark:text-zinc-400 md:whitespace-nowrap md:break-normal">
                v{pkg.version}
              </p>
            </div>
            <div className="mt-1 flex items-center">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1" title="Authors">
                <UserIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" aria-hidden="true" />
                <span className="sr-only">Authors: </span>
                {pkg.owners.map((owner, i) => {
                  const isActive = controls.owner === owner.id;
                  return (
                  <span key={owner.id} className="text-xs text-gray-600 dark:text-zinc-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ owner: isActive ? undefined : owner.id });
                      }}
                      aria-pressed={isActive}
                      title={isActive ? `Clear author filter: ${owner.name}` : `Filter by author: ${owner.name}`}
                      aria-label={isActive ? `Clear author filter: ${owner.name}` : `Filter by author: ${owner.name}`}
                      className={`transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 rounded-sm ${isActive ? "text-brand-700 font-bold dark:text-brand-400" : "hover:text-brand-600 dark:hover:text-brand-400"}`}
                    >
                      {owner.name}
                    </button>
                    {i < pkg.owners.length - 1 ? "," : ""}
                  </span>
                )})}
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-shrink-0 flex-grow-0 justify-between lg:w-auto lg:justify-end">
          <span className="sr-only">
            {supportedPlatformsList.length > 0
              ? `Supports ${supportedPlatformsList.join(", ")}`
              : "No platform compatibility specified"}
          </span>
          <div className="items-top mt-1 flex flex-wrap gap-4" aria-hidden="true">
            <div className="flex gap-1">
              <Icon isEnabled={has(Filters.Windows)} src="/icons/win.svg" alt="Windows" />
              <Icon isEnabled={has(Filters.Mac)} src="/icons/mac.svg" alt="Mac" />
            </div>
            <div className="flex gap-1">
              <Icon isEnabled={has(Filters.Rhino6)} src="/icons/rhino6.png" alt="Rhino 6" />
              <Icon isEnabled={has(Filters.Rhino7)} src="/icons/rhino7.png" alt="Rhino 7" />
              <Icon isEnabled={has(Filters.Rhino8)} src="/icons/rhino8.png" alt="Rhino 8" />
              <Icon isEnabled={has(Filters.Rhino9)} src="/icons/rhino9.png" alt="Rhino 9 (WIP)" />
            </div>
            <div className="flex gap-1">
              <Icon isEnabled={has(Filters.Rhino)} src="/icons/rhp.png" alt="Rhino plugin" />
              <Icon
                isEnabled={has(Filters.Grasshopper)}
                src="/icons/gha.png"
                alt="Grasshopper plugin"
              />
            </div>
          </div>
          <div className="ml-4 flex flex-col items-end justify-start gap-1">
            <div className="flex items-center gap-1" title="Total downloads">
              <StarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" aria-hidden="true" />
              <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                <span className="sr-only">Downloads: </span>
                {downloads}
              </p>
            </div>
            {downloadsWeek > 0 && (
              <div className="flex items-center gap-1" title="Downloads in the last 7 days">
                <p className="text-xs font-medium text-brand-600 dark:text-brand-400">
                  <span className="sr-only">Weekly downloads: </span>+
                  {downloadsWeek.toLocaleString()}/week
                </p>
              </div>
            )}
            {/* The copy button rides alongside the date rather than taking a
                row of its own, where it read as an orphan on narrow cards. */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1" title="Last updated">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" aria-hidden="true" />
                <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                  <span className="sr-only">Last updated: </span>
                  {date}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                title={copied ? "Copied to clipboard!" : `Copy link to ${pkg.id}`}
                aria-label={`Copy link to ${pkg.id}`}
                className={`flex flex-shrink-0 items-center gap-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 rounded-sm ${copied
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
              >
                {copied ? (
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {/* The check icon carries the confirmation on its own where
                    the label would push the row into the platform icons. */}
                {copied && (
                  <span className="hidden text-[10px] font-bold uppercase sm:inline" aria-hidden="true">
                    Copied!
                  </span>
                )}
              </button>
            </div>
            <div aria-live="polite" className="sr-only">
              {copied ? "Link copied to clipboard!" : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${pkg.id} details` : `Expand ${pkg.id} details`}
            title={isExpanded ? `Collapse ${pkg.id} details` : `Expand ${pkg.id} details`}
            aria-controls={`package-details-${pkg.id}`}
            className="ml-4 flex-shrink-0 rounded-full p-1 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-brand-400"
          >
            <ChevronDownIcon
              aria-hidden="true"
              className={`h-5 w-5 text-gray-400 transition-transform duration-300 dark:text-zinc-500 ${isExpanded ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>
      </div>
      <div className="mt-2 flex min-w-0 items-start gap-4 md:gap-6">
        {hasDescription ? (
          <p className={`break-long-words min-w-0 flex-grow whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-zinc-300 ${isExpanded ? "" : "line-clamp-4"}`}>
            {pkg.description}
          </p>
        ) : (
          <p className="min-w-0 flex-grow text-sm italic leading-relaxed text-gray-500 dark:text-zinc-400">
            No description provided
          </p>
        )}
        <a
          href={link}
          aria-label={`Install ${pkg.id}`}
          title={`Install ${pkg.id}`}
          className="hidden items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:focus-visible:ring-brand-400 md:flex"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
          Install
        </a>
      </div>
      {/* Quick view: a peek and a hand-off to the package page. It repeats
          nothing from the rows above and fetches nothing; /package/[id] owns
          the detail, the release history and the install help. */}
      <div
        id={`package-details-${pkg.id}`}
        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "mt-4 grid-rows-[1fr] opacity-100 visible" : "grid-rows-[0fr] opacity-0 invisible"
          }`}
      >
        {/* The side padding keeps the focus rings of the chips and buttons
            from being clipped by overflow-hidden. */}
        <div className="-mx-1 overflow-hidden px-1">
          <div className="flex flex-col gap-3 border-t border-gray-100 pb-1 pt-4 dark:border-zinc-800">
            {keywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Keywords</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {shownKeywords.map((tag) => {
                    const isActive = (controls.tag ?? "").toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={isActive}
                        title={isActive ? `Clear keyword filter: ${tag}` : `Filter by keyword: ${tag}`}
                        aria-label={isActive ? `Clear keyword filter: ${tag}` : `Filter by keyword: ${tag}`}
                        onClick={() => navigate({ tag: isActive ? undefined : tag })}
                        className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 ${
                          isActive
                            ? "bg-brand-100 text-brand-800 ring-brand-500/30 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-400/30"
                            : "bg-slate-100 text-slate-600 ring-slate-500/10 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/50 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {keywords.length > shownKeywords.length && (
                    <a href={`${packagePath(pkg.id)}#keywords`} className="pkg-link text-xs font-medium">
                      All {keywords.length.toLocaleString()} keywords →
                    </a>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600 dark:text-zinc-400">{facts.join(" · ")}</p>

            {/* The row-1 Install is the card's one Install. rhino:// cannot run
                on a phone, so below md the card says where to install from. */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="w-full text-xs text-gray-500 dark:text-zinc-400 md:hidden">
                Install from Rhino on your desktop computer.
              </p>
              <a
                href={packagePath(pkg.id)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 dark:focus-visible:ring-white/30 md:w-auto"
              >
                Full details →
              </a>
              {websiteHref && (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="pkg-button">
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
                  Website<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              {emailHref && (
                <a href={emailHref} className="pkg-button">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
                  Email the author
                </a>
              )}
            </div>
            {/* The Install button is a rhino:// link, which does nothing on a
                machine without Rhino and gives no feedback. The package page
                has the hand-install routes. */}
            <p className="hidden text-xs md:block">
              <a href={`${packagePath(pkg.id)}#install`} className="pkg-link">
                Install did nothing? Get the .yak file or terminal command →
              </a>
            </p>
          </div>
        </div>
      </div>
    </li>
  );
});

function Icon({ isEnabled, src, alt }: { isEnabled: boolean; src: string; alt: string }) {
  const isSvg = src.endsWith(".svg");
  const title = isEnabled ? `Supported on ${alt}` : `Not supported on ${alt}`;
  return (
    <Image
      className={`h-[1.2rem] w-[1.2rem] ${isSvg ? "dark:invert" : "dark:brightness-110"}${isEnabled ? "" : " opacity-25"
        }`}
      src={src}
      width={32}
      height={32}
      alt=""
      aria-hidden="true"
      title={title}
    />
  );
}
