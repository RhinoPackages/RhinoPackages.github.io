import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ChevronDownIcon,
  LinkIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { pageResults, Filters, Package, YakVersionHistoryItem } from "@/app/_components/api";
import { usePackageContext } from "./PackageContext";

export default function PackageList() {
  const { controls, packages, navigate, stats } = usePackageContext();
  const expandedId = controls.p ?? null;

  const disablePagination = packages.length === 0 || (controls.page === 0 && packages.length !== pageResults);

  return (
    <div className="flex flex-col">
      {/* Stats Banner / Header */}
      <div className="mt-4 mb-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            Packages Directory
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {packages.length === 0
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

      <ul role="list" className="flex flex-grow flex-col gap-5">
        {packages.map((pkg) => {
          return (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isExpanded={expandedId === pkg.id}
              onToggle={() => navigate({ p: expandedId === pkg.id ? undefined : pkg.id })}
            />
          );
        })}
      </ul>

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

function PackageCard({
  pkg,
  isExpanded,
  onToggle,
}: {
  pkg: Package;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { navigate } = usePackageContext();
  const [versionHistory, setVersionHistory] = useState<YakVersionHistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPrereleases, setShowPrereleases] = useState(false);
  const [copied, setCopied] = useState(false);

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
      })
      .finally(() => setHistoryLoading(false));
  }, [isExpanded, pkg.id, versionHistory]);

  function has(constant: Filters) {
    return constant === (pkg.filters & constant);
  }

  let url = !pkg.homepageUrl ? "#" : pkg.homepageUrl;

  if (!url.startsWith("http")) {
    url = "//" + url;
  }

  const link = `rhino://package/search?name=${pkg.id}`;
  const tags = pkg.keywords ? pkg.keywords.split(",").map((tag) => tag.trim()) : undefined;
  const date = new Date(pkg.updated).toLocaleDateString();
  const downloads = pkg.downloads.toLocaleString();

  // Relative time for expanded view
  const relativeTime = getRelativeTime(new Date(pkg.updated));

  return (
    <li
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 dark:bg-zinc-900/40 md:p-6 ${isExpanded
        ? "border-brand-300 shadow-md dark:border-brand-700 dark:bg-zinc-900/80"
        : "border-gray-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-brand-700 dark:hover:bg-zinc-900/80"
        } p-4`}
    >
      <div
        className="mb-2 flex cursor-pointer flex-col gap-2 md:flex-row md:gap-0"
        onClick={onToggle}
      >
        <div className="flex flex-grow gap-x-4">
          <Image
            className="h-[2.5rem] w-[2.5rem]"
            src={pkg.iconUrl}
            width={40}
            height={40}
            alt="Package icon"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                {pkg.id}
              </span>
              {pkg.prerelease && (
                <span className="rounded-full bg-yellow-50 px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-wider text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20">
                  wip
                </span>
              )}
              <p className="whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-zinc-400">v{pkg.version}</p>
            </div>
            <div className="mt-1 flex items-center">
              <div className="flex flex-wrap items-center gap-x-1 whitespace-nowrap">
                <UserIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                {pkg.owners.map((owner, i) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ owner: owner.id });
                    }}
                    key={owner.id}
                    className="text-xs text-gray-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
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
            <div className="flex items-center gap-1">
              <StarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">{downloads}</p>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">{date}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Link"
              className={`mt-0.5 flex items-center gap-1 transition-all ${copied
                ? "text-green-600 dark:text-green-400"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {copied && <span className="text-[10px] font-bold uppercase">Copied!</span>}
            </button>
          </div>
          <ChevronDownIcon
            className={`ml-4 mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-300 dark:text-zinc-500 ${isExpanded ? "rotate-180" : ""
              }`}
          />
        </div>
      </div>
      <div className="mt-2 flex items-start gap-4 md:gap-6">
        <p className="break-long-words flex-grow whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          {pkg.description}
        </p>
        <a
          href={link}
          className="hidden items-center gap-1.5 whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 hover:shadow active:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 md:flex"
        >
          <ArrowDownTrayIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
          Install
        </a>
      </div>
      {(tags && tags.length > 0 && tags[0] !== "") && (
        <div className="mt-4 flex flex-wrap place-items-center items-start gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ search: tag });
              }}
              className="cursor-pointer rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-500/20 group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/50 dark:hover:bg-brand-900/30 dark:hover:text-brand-300 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-300"
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
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Install in Rhino
              </a>
              {pkg.homepageUrl && pkg.homepageUrl !== "#" && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50 active:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  Homepage
                </a>
              )}
            </div>

            {/* Version History Table */}
            {versionHistory && versionHistory.length > 0 && (
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
                      {versionHistory
                        .filter((v) => showPrereleases || !v.prerelease)
                        .map((v) => {
                          const vDate = new Date(v.createdAt).toLocaleDateString();
                          const platforms = Array.from(new Set(v.distributions.map((d) => d.platform)));
                          const rhinoVersions = Array.from(new Set(v.distributions.map((d) => d.rhinoVersion.replace("rh", "Rhino ").replace("_", "."))));

                          return (
                            <tr key={v.version} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                              <td className="whitespace-nowrap px-4 py-2 text-xs">{vDate}</td>
                              <td className="px-4 py-2 font-mono text-xs">
                                {v.version}
                                {v.prerelease && (
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
                                    <span key={rv} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                                      {rv}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <a
                                  href={`rhino://package/search?name=${pkg.id}&version=${v.version}`}
                                  className="inline-flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/40"
                                >
                                  <ArrowDownTrayIcon className="h-3 w-3" />
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
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${active
        ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20"
        : "bg-gray-50 text-gray-500 ring-gray-500/10 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700/50"
        }`}
    >
      {active ? "✓ " : ""}{label}
    </span>
  );
}

function Icon({ isEnabled, src, alt }: { isEnabled: boolean; src: string; alt: string }) {
  const isSvg = src.endsWith(".svg");
  return (
    <Image
      className={`h-[1.2rem] w-[1.2rem] ${isSvg ? "dark:invert" : "dark:brightness-110"}${isEnabled ? "" : " opacity-25"
        }`}
      src={src}
      width={32}
      height={32}
      alt={alt}
    />
  );
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


