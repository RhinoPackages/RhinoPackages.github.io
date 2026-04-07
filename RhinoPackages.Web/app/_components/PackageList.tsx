import { memo, useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ChevronDownIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { pageResults, Filters, Package, Distribution, YakVersionHistoryItem } from "@/app/_components/api";
import { Params, usePackageContext, defaultParams } from "./PackageContext";
import Spinner from "./Spinner";

export default function PackageList() {
  const { controls, packages, navigate, stats, status } = usePackageContext();
  const expandedId = controls.p ?? null;

  const disablePagination = packages.length === 0 || (controls.page === 0 && packages.length !== pageResults);

  return (
    <div className="flex min-w-0 w-full flex-col">
      {/* Stats Banner / Header */}
      <div className="mt-4 mb-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Packages Directory
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400" aria-live="polite" aria-atomic="true">
            {status.isLoading
              ? "Loading packages..."
              : packages.length === 0
                ? "No packages found matching your criteria."
                : `Showing page ${controls.page + 1}`}
          </p>
        </div>
        <div className="hidden divide-x divide-gray-200 text-sm dark:divide-zinc-800 md:flex">
          <div className="flex flex-col pr-4">
            <span className="text-gray-500 dark:text-zinc-400">Total Packages</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{stats?.totalPackages.toLocaleString() ?? "-"}</span>
          </div>
          <div className="flex flex-col px-4">
            <span className="text-gray-500 dark:text-zinc-400">Total Downloads</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{stats?.totalDownloads.toLocaleString() ?? "-"}</span>
          </div>
          <div className="flex flex-col pl-4">
            <span className="text-gray-500 dark:text-zinc-400">Updated Monthly</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">{stats?.recentUpdates.toLocaleString() ?? "-"}</span>
          </div>
        </div>
      </div>

      {packages.length === 0 && !status.isLoading && status.isIdle ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500" aria-hidden="true" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">No packages found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate(defaultParams)}
              className="inline-flex items-center rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              Clear all filters
            </button>
          </div>
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

  return <div ref={setRef} className="h-10 w-full" />;
}

function parseWebsiteAction(homepageUrl: Package["homepageUrl"]) {
  const raw = typeof homepageUrl === "string" ? homepageUrl.trim() : "";
  if (!raw) {
    return { websiteHref: undefined, emailHref: undefined };
  }

  const trimmedForEmail = raw.replace(/[;,.!?]+$/, "").trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(trimmedForEmail)) {
    return { websiteHref: undefined, emailHref: `mailto:${trimmedForEmail}` };
  }

  const trimmedForWebsite = raw.replace(/[;\s]+$/, "").trim();
  if (!trimmedForWebsite) {
    return { websiteHref: undefined, emailHref: undefined };
  }

  if (/^https?:\/\//i.test(trimmedForWebsite)) {
    try {
      const parsed = new URL(trimmedForWebsite);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return { websiteHref: trimmedForWebsite, emailHref: undefined };
      }
    } catch {
      return { websiteHref: undefined, emailHref: undefined };
    }
    return { websiteHref: undefined, emailHref: undefined };
  }

  const domainLikePattern = /^(localhost|([a-z0-9-]+\.)+[a-z]{2,})(:\d+)?(\/.*)?$/i;
  if (domainLikePattern.test(trimmedForWebsite)) {
    return { websiteHref: `https://${trimmedForWebsite}`, emailHref: undefined };
  }

  return { websiteHref: undefined, emailHref: undefined };
}

const PackageCard = memo(function PackageCard({
  pkg,
  isExpanded,
  navigate,
}: {
  pkg: Package;
  isExpanded: boolean;
  navigate: (value: { [Key in keyof Params]?: Params[Key] }) => void;
}) {
  const [versionHistory, setVersionHistory] = useState<YakVersionHistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPrereleases, setShowPrereleases] = useState(false);
  const [copied, setCopied] = useState(false);
  const onToggle = () => navigate({ p: isExpanded ? undefined : pkg.id });

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set("p", pkg.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!isExpanded || versionHistory !== null) return;
    setHistoryLoading(true);

    // Fetch the complete version history from local static data
    fetch(`./data/versions/${pkg.id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("History not found");
        return r.json();
      })
      .then((data: YakVersionHistoryItem[]) => {
        setVersionHistory(data);
      })
      .catch((err) => {
        console.warn(`Could not load history for ${pkg.id}:`, err);
        setVersionHistory([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [isExpanded, pkg.id, versionHistory]);

  function has(constant: Filters) {
    return constant === (pkg.filters & constant);
  }

  const { websiteHref, emailHref } = parseWebsiteAction(pkg.homepageUrl);

  const link = `rhino://package/search?name=${pkg.id}`;
  const tags = pkg.keywords ? pkg.keywords.split(",").map((tag) => tag.trim()) : undefined;
  const date = new Date(pkg.updated).toLocaleDateString();
  const downloads = pkg.downloads.toLocaleString();

  // Relative time for expanded view
  const relativeTime = getRelativeTime(new Date(pkg.updated));
  const versionRows = versionHistory
    ? groupVersionHistory(versionHistory.filter((v) => showPrereleases || !v.prerelease))
    : [];

  return (
    <li
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 dark:bg-zinc-900/40 md:p-6 ${isExpanded
        ? "border-brand-300 shadow-md dark:border-brand-700 dark:bg-zinc-900/80"
        : "border-gray-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-brand-700 dark:hover:bg-zinc-900/80"
        } p-4`}
    >
      <div
        className="mb-2 flex cursor-pointer flex-col gap-2 rounded-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:flex-row md:gap-0 dark:focus-visible:ring-brand-400"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              onToggle();
            }
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className="flex min-w-0 flex-grow gap-x-4">
          <Image
            className="h-[2.5rem] w-[2.5rem]"
            src={pkg.iconUrl}
            width={40}
            height={40}
            alt={`Icon for ${pkg.id} package`}
          />
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="break-long-words text-lg font-bold text-gray-900 dark:text-zinc-100">
                {pkg.id}
              </span>
              {pkg.prerelease && (
                <span
                  title="Work in progress (Pre-release)"
                  className="rounded-full bg-yellow-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20"
                >
                  <span aria-hidden="true">wip</span>
                  <span className="sr-only">Pre-release</span>
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
                {pkg.owners.map((owner, i) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ owner: owner.id });
                    }}
                    key={owner.id}
                    title={`Filter by author: ${owner.name}`}
                    aria-label={`Filter by author: ${owner.name}`}
                    className="text-xs text-gray-600 transition-colors hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:text-brand-400 dark:focus-visible:ring-brand-400 rounded-sm"
                  >
                    {owner.name}{i < pkg.owners.length - 1 ? "," : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-shrink-0 flex-grow-0 justify-between md:w-auto md:justify-end">
          <div className="items-top mt-1 flex flex-wrap gap-4">
            <div className="flex gap-1">
              <Icon isEnabled={has(Filters.Windows)} src="/icons/win.svg" alt="Windows" />
              <Icon isEnabled={has(Filters.Mac)} src="/icons/mac.svg" alt="Mac" />
            </div>
            <div className="flex gap-1">
              <Icon isEnabled={has(Filters.Rhino6)} src="/icons/rhino6.png" alt="Rhino 6" />
              <Icon isEnabled={has(Filters.Rhino7)} src="/icons/rhino7.png" alt="Rhino 7" />
              <Icon isEnabled={has(Filters.Rhino8)} src="/icons/rhino8.png" alt="Rhino 8" />
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
              title="Copy Link"
              aria-label="Copy link to package"
              aria-live="polite"
              className={`mt-0.5 flex items-center gap-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 rounded-sm ${copied
                ? "text-green-600 dark:text-green-400"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
            >
              <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {copied && <span className="text-[10px] font-bold uppercase">Copied!</span>}
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse package details" : "Expand package details"}
            title={isExpanded ? "Collapse package details" : "Expand package details"}
            className="ml-4 flex-shrink-0 rounded-full p-1 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-brand-400"
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
        <p className="break-long-words min-w-0 flex-grow whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          {pkg.description}
        </p>
        <a
          href={link}
          aria-label={`Install ${pkg.id}`}
          className="hidden items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow active:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:focus-visible:ring-brand-400 md:flex"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
          Install
        </a>
      </div>
      {(tags && tags.length > 0 && tags[0] !== "") && (
        <div className="mt-4 flex flex-wrap place-items-center items-start gap-2">
          <span className="sr-only">Keywords: </span>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              title={`Filter by keyword: ${tag}`}
              aria-label={`Filter by keyword: ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                navigate({ search: tag });
              }}
              className="cursor-pointer rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/50 dark:hover:bg-brand-900/30 dark:hover:text-brand-300 dark:focus-visible:ring-brand-400 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-300"
            >
              {tag}
            </button>
          ))}
        </div>
      )}


      {/* Expanded Detail Panel */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Download trends from Yak API */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Total Downloads</span>
                <span className="text-xl font-bold text-gray-900 dark:text-zinc-100">{downloads}</span>
                <div className="mt-1 flex flex-col gap-1">
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Last Updated</span>
                <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">{date}</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{relativeTime}</span>
              </div>

              {/* Authors */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Authors</span>
                <span className="text-sm text-gray-900 dark:text-zinc-100">{pkg.authors || "—"}</span>
              </div>

              {/* Platform Compatibility */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Platforms</span>
                <div className="flex flex-wrap gap-2">
                  <Badge label="Windows" active={has(Filters.Windows)} />
                  <Badge label="Mac" active={has(Filters.Mac)} />
                </div>
              </div>

              {/* Version Compatibility */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Rhino Versions</span>
                <div className="flex flex-wrap gap-2">
                  <Badge label="Rhino 6" active={has(Filters.Rhino6)} />
                  <Badge label="Rhino 7" active={has(Filters.Rhino7)} />
                  <Badge label="Rhino 8" active={has(Filters.Rhino8)} />
                </div>
              </div>

              {/* Plugin Type */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Plugin Type</span>
                <div className="flex flex-wrap gap-2">
                  <Badge label="Rhino" active={has(Filters.Rhino)} />
                  <Badge label="Grasshopper" active={has(Filters.Grasshopper)} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4 dark:border-zinc-700">
              <a
                href={link}
                aria-label={`Install ${pkg.id} in Rhino`}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 dark:focus-visible:ring-white/30"
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Install in Rhino
              </a>
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${pkg.id} website`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:focus-visible:ring-brand-400"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                  Website
                </a>
              )}
              {emailHref && (
                <a
                  href={emailHref}
                  aria-label={`Email ${pkg.id} author`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:focus-visible:ring-brand-400"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                  Email
                </a>
              )}
            </div>

            {/* Version History Table */}
            {historyLoading ? (
              <div className="mt-6 flex justify-center py-6 border-t border-gray-200 dark:border-zinc-700">
                <Spinner />
              </div>
            ) : versionHistory && versionHistory.length === 0 ? (
              <div className="mt-6 border-t border-gray-200 pt-6 pb-2 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
                <p>No version history available.</p>
              </div>
            ) : versionHistory && versionHistory.length > 0 ? (
              <div className="mt-6 border-t border-gray-200 pt-4 dark:border-zinc-700">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Version History</span>
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={showPrereleases}
                      onChange={(e) => setShowPrereleases(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-600 dark:border-zinc-600 dark:bg-zinc-800 dark:checked:bg-brand-500"
                    />
                    Show pre-releases
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
                    <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-500 dark:bg-zinc-800/50 dark:text-zinc-500">
                      <tr>
                        <th className="rounded-tl-md px-4 py-2">Date</th>
                        <th className="px-4 py-2">Version</th>
                        <th className="px-4 py-2">Platforms</th>
                        <th className="rounded-tr-md px-4 py-2 text-right">Install</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-zinc-700/50">
                      {versionRows
                        .map((row) => {
                          const vDate = new Date(row.createdAt).toLocaleDateString();
                          const platforms = Array.from(
                            new Set(
                              row.distributions
                                .map((d) => d?.platform)
                                .filter((p): p is string => typeof p === "string" && p.length > 0)
                            )
                          );
                          const rhinoVersions = Array.from(
                            new Set(
                              row.distributions
                                .map((d) => d?.rhinoVersion)
                                .filter((rv): rv is string => typeof rv === "string" && rv.length > 0)
                            )
                          ).map((raw) => {
                            const versionLabel = raw.replace(/^rh/, "").replace("_", ".");
                            return {
                              raw,
                              label: `Rhino ${versionLabel}`,
                              url: `https://rhinoversions.github.io/?version=${encodeURIComponent(versionLabel)}&locale=en-us`,
                            };
                          });

                          return (
                            <tr key={`${row.version}-${row.createdAt}`} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                              <td className="whitespace-nowrap px-4 py-2 text-xs">{vDate}</td>
                              <td className="px-4 py-2 font-mono text-xs">
                                {row.version}
                                {row.prerelease && (
                                  <span className="ml-2 rounded-full bg-brand-50 px-1.5 py-0.5 text-[0.6rem] font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                                    Pre-release
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {platforms.map((p) => (
                                    <span key={p} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                                      {p === 'mac' ? 'Mac' : 'Windows'}
                                    </span>
                                  ))}
                                  {rhinoVersions.map((rv) => (
                                    <a
                                      key={rv.raw}
                                      href={rv.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Open ${rv.label} on RhinoVersions`}
                                      className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-blue-700 underline decoration-solid underline-offset-2 transition-colors hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 dark:hover:text-blue-200 dark:focus-visible:ring-blue-400"
                                    >
                                      {rv.label}
                                      <span aria-hidden="true" className="text-[0.6rem]">↗</span>
                                    </a>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <a
                                  href={`rhino://package/search?name=${pkg.id}${row.installVersion ? `&version=${row.installVersion}` : ""}`}
                                  aria-label={`Install ${pkg.id} version ${row.installVersion}`}
                                  className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/40 dark:focus-visible:ring-brand-400"
                                >
                                  <ArrowDownTrayIcon className="h-3 w-3" aria-hidden="true" />
                                  Install
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
});

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${active
        ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20"
        : "bg-gray-50 text-gray-500 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700/50"
        }`}
    >
      <span className="sr-only">{active ? `Supported: ${label}` : `Not supported: ${label}`}</span>
      <span aria-hidden="true">{active ? "✓ " : ""}{label}</span>
    </span>
  );
}

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
      alt={isEnabled ? `Supported on ${alt}` : `Not supported on ${alt}`}
      title={title}
    />
  );
}

type GroupedVersionHistoryRow = {
  createdAt: string;
  version: string;
  installVersion: string | null;
  installVersionByRhino: Map<string, string>;
  distributions: Distribution[];
  prerelease: boolean;
};

function groupVersionHistory(items: YakVersionHistoryItem[]): GroupedVersionHistoryRow[] {
  const grouped = new Map<string, GroupedVersionHistoryRow & { versions: Set<string> }>();

  for (const item of items) {
    const normalized = normalizeVersionForGrouping(item);
    const key = `${normalized.baseVersion}__${item.prerelease ? "pre" : "stable"}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        createdAt: item.createdAt,
        version: normalized.baseVersion,
        installVersion: item.version,
        installVersionByRhino: new Map<string, string>(),
        distributions: [...item.distributions],
        prerelease: item.prerelease,
        versions: new Set([item.version]),
      });
      for (const dist of item.distributions) {
        grouped.get(key)!.installVersionByRhino.set(dist.rhinoVersion, item.version);
      }
      continue;
    }

    if (new Date(item.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      existing.createdAt = item.createdAt;
    }

    for (const dist of item.distributions) {
      if (!existing.distributions.some((d) => d.url === dist.url)) {
        existing.distributions.push(dist);
      }
      const current = existing.installVersionByRhino.get(dist.rhinoVersion);
      if (!current || compareNumericVersions(item.version, current) > 0) {
        existing.installVersionByRhino.set(dist.rhinoVersion, item.version);
      }
    }

    existing.versions.add(item.version);
  }

  return Array.from(grouped.values())
    .map((row) => ({
      createdAt: row.createdAt,
      version: row.version,
      installVersion: row.versions.size === 1 ? row.installVersion : null,
      installVersionByRhino: row.installVersionByRhino,
      distributions: row.distributions,
      prerelease: row.prerelease,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function normalizeVersionForGrouping(item: YakVersionHistoryItem): { baseVersion: string } {
  const majors = Array.from(
    new Set(
      item.distributions
        .map((d) => {
          const match = d.rhinoVersion.match(/^rh(\d+)_/);
          return match ? Number(match[1]) : null;
        })
        .filter((v): v is number => v !== null)
    )
  );

  const parts = item.version.split(".");
  const lastPart = Number(parts[parts.length - 1]);
  const canCollapse = parts.length > 1 && Number.isInteger(lastPart) && majors.length === 1 && lastPart === majors[0];

  return { baseVersion: canCollapse ? parts.slice(0, -1).join(".") : item.version };
}

function compareNumericVersions(a: string, b: string): number {
  const aParts = a.split(".").map((p) => Number(p));
  const bParts = b.split(".").map((p) => Number(p));
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const av = Number.isFinite(aParts[i]) ? aParts[i] : 0;
    const bv = Number.isFinite(bParts[i]) ? bParts[i] : 0;
    if (av !== bv) return av - bv;
  }

  return 0;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
}
