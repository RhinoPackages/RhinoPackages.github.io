import { Fragment, memo, useEffect, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  pageResults,
  Package,
  compactNumber,
  formatDate,
  latestRelease,
  matchesOwner,
  normalizeName,
  relativeTime,
} from "@/app/_components/api";
import {
  AuthorRef,
  authorPath,
  displayKeywords,
  formatBytes,
  hasDescription,
  packagePath,
  parseWebsiteAction,
  platformsShort,
  pluginKind,
  rhinoVersionsText,
  statusBadges,
  statusToneClasses,
  uniqueOwners,
} from "./packageInfo";
import { Params, Sort, usePackageContext, defaultParams, hasActiveFilters } from "./PackageContext";
import PackageIcon from "./PackageIcon";
import Spinner from "./Spinner";

export default function PackageList() {
  const {
    controls,
    packages,
    filteredCount,
    navigate,
    stats,
    status,
    ownerSummary,
    ownerName,
    authorByName,
  } = usePackageContext();
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
                ownerName={ownerName}
                authorByName={authorByName}
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

/** Publisher names a card names before "+N"; the package page lists them all. */
const ownerNamesShown = 2;

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
  ownerName,
  authorByName,
}: {
  pkg: Package;
  isExpanded: boolean;
  navigate: (value: { [Key in keyof Params]?: Params[Key] }) => void;
  controls: Params;
  ownerName: string | undefined;
  authorByName: Map<string, AuthorRef>;
}) {
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

  // The one most important status; the package page lists them all.
  const badge = statusBadges(pkg)[0];
  const lastRelease = latestRelease(pkg);
  const downloadsWeek = pkg.downloadsWeek ?? 0;
  // The weekly figure is what the Trending and Rising sorts rank by; under any
  // other sort it is just a second number next to the total.
  const showWeek =
    downloadsWeek > 0 && (controls.sort === Sort.Trending || controls.sort === Sort.Rising);

  // Publishers, the filtered author first so the card says why it is listed.
  const owners = uniqueOwners(pkg, ownerName);
  const shownOwners = owners.slice(0, ownerNamesShown);
  const hiddenOwners = owners.slice(ownerNamesShown);
  // The filter also matches names that are only in the credit list. Then the
  // filtered author is on none of the accounts above, so say so.
  const filteredName = ownerName ? normalizeName(ownerName) : undefined;
  const isCreditedOnly =
    controls.owner !== undefined &&
    matchesOwner(pkg, controls.owner, ownerName) &&
    !pkg.owners.some((o) => o.id === controls.owner || normalizeName(o.name) === filteredName);

  const by =
    shownOwners.length > 0 ? (
      <>
        by{" "}
        {shownOwners.map((owner, i) => {
          // Only authors with a page of their own are linked; for the rest the
          // page would just repeat the package.
          const author = authorByName.get(normalizeName(owner.name));
          return (
            <Fragment key={owner.id}>
              {i > 0 && ", "}
              {author?.indexed ? (
                <a
                  href={authorPath(author.slug)}
                  className="rounded-sm underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900 hover:decoration-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:decoration-zinc-600 dark:hover:text-zinc-100 dark:hover:decoration-zinc-400 dark:focus-visible:ring-brand-400"
                >
                  {owner.name}
                </a>
              ) : (
                owner.name
              )}
            </Fragment>
          );
        })}
        {hiddenOwners.length > 0 && (
          <>
            {" "}
            <span title={`Also: ${hiddenOwners.map((owner) => owner.name).join(", ")}`}>
              +{hiddenOwners.length}
            </span>
          </>
        )}
      </>
    ) : null;

  // Three groups so a phone can break between them instead of mid-phrase;
  // from sm up they run together as one line, which wraps only between
  // segments, never inside one.
  const metaGroups = [
    [
      by,
      isCreditedOnly ? (
        <span key="credited" title={`${ownerName} is credited in this package's author list, not a publisher`}>
          {ownerName} credited
        </span>
      ) : null,
      pluginKind(pkg),
    ],
    [rhinoVersionsText(pkg), platformsShort(pkg)],
    [
      `${compactNumber(pkg.downloads)} ${pkg.downloads === 1 ? "download" : "downloads"}`,
      showWeek ? `+${compactNumber(downloadsWeek)} this week` : null,
      <time key="updated" dateTime={lastRelease.toISOString()} title={formatDate(lastRelease)} className="whitespace-nowrap">
        updated {relativeTime(lastRelease)}
      </time>,
    ],
  ]
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length > 0);

  return (
    <li
      id={packageAnchorId(pkg.id)}
      className={`flex scroll-mt-20 flex-col overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-colors dark:bg-zinc-900/40 md:scroll-mt-4 md:p-5 ${isExpanded
        ? "border-brand-300 dark:border-brand-700 dark:bg-zinc-900/80"
        : "border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-600"
        }`}
    >
      <div className="flex items-center gap-3">
        <PackageIcon className="h-10 w-10 flex-shrink-0" src={pkg.iconUrl} size={40} />
        {/* A plain link, not next/link: with up to 1,275 cards on the page,
            prefetching every package page would cost more than it saves. The
            chevron is the only control that expands the card. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={packagePath(pkg.id)}
            className="break-long-words rounded-sm text-lg font-bold text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-100 dark:focus-visible:ring-brand-400"
          >
            {pkg.id}
          </a>
          {badge && (
            <span
              title={badge.title}
              className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-medium leading-4 ring-1 ring-inset ${statusToneClasses[badge.tone]}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        {/* rhino:// cannot run on a phone, so Install starts at md. */}
        <a
          href={link}
          aria-label={`Install ${pkg.id}`}
          title={`Install ${pkg.id}`}
          className="hidden flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:focus-visible:ring-brand-400 md:inline-flex"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
          Install
        </a>
        {/* The padding makes a 44px target; the negative margin keeps it from
            making the row taller. */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={`package-details-${pkg.id}`}
          aria-label={isExpanded ? `Hide quick view of ${pkg.id}` : `Show quick view of ${pkg.id}`}
          title={isExpanded ? `Hide quick view of ${pkg.id}` : `Show quick view of ${pkg.id}`}
          className="-m-2 flex-shrink-0 rounded-full p-3 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-brand-400"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={`h-5 w-5 text-gray-500 transition-transform duration-300 dark:text-zinc-400 ${isExpanded ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400 md:pl-[3.25rem]">
        {metaGroups.map((group, i) => (
          <span key={i} className="block sm:inline">
            {i > 0 && <span className="hidden sm:inline"> · </span>}
            {group.map((part, j) => (
              <Fragment key={j}>
                {j > 0 && " · "}
                {typeof part === "string" ? <span className="whitespace-nowrap">{part}</span> : part}
              </Fragment>
            ))}
          </span>
        ))}
      </p>
      {hasDescription(pkg) ? (
        <p className={`break-long-words mt-2 min-w-0 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-zinc-300 md:pl-[3.25rem] ${isExpanded ? "" : "line-clamp-2"}`}>
          {pkg.description}
        </p>
      ) : (
        <p className="mt-2 min-w-0 text-sm italic leading-relaxed text-gray-500 dark:text-zinc-400 md:pl-[3.25rem]">
          No description provided
        </p>
      )}
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
