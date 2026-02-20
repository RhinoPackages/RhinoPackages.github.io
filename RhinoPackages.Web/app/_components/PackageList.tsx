import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ChevronDownIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { pageResults, Filters, Package } from "@/app/_components/api";
import { usePackageContext } from "./PackageContext";

interface YakVersionDetails {
  downloads: {
    last_day: number;
    last_week: number;
    last_month: number;
  };
}

export default function PackageList() {
  const { controls, packages, navigate, stats } = usePackageContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
              onToggle={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
            />
          );
        })}
      </ul>
      {!disablePagination && (
        <div className="mx-6 mt-10 mb-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-zinc-800">
          <button
            disabled={controls.page === 0}
            onClick={() => navigate({ page: controls.page - 1 })}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-25 disabled:hover:text-gray-500 dark:text-zinc-400 dark:hover:text-zinc-100 dark:disabled:hover:text-zinc-400"
          >
            <ArrowLongLeftIcon className="mt-[0.1rem] h-5 w-5" aria-hidden="true" />
            Previous
          </button>
          <button
            disabled={packages.length !== pageResults}
            onClick={() => navigate({ page: controls.page + 1 })}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-25 disabled:hover:text-gray-500 dark:text-zinc-400 dark:hover:text-zinc-100 dark:disabled:hover:text-zinc-400"
          >
            Next
            <ArrowLongRightIcon className="mt-[0.1rem] h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
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
  const [yakDetails, setYakDetails] = useState<YakVersionDetails | null>(null);
  const [yakLoading, setYakLoading] = useState(false);

  useEffect(() => {
    if (!isExpanded || yakDetails !== null) return;
    setYakLoading(true);
    fetch(`https://yak.rhino3d.com/versions/${pkg.id}/${pkg.version}`)
      .then((r) => r.json())
      .then((data) => {
        setYakDetails(data);
        setYakLoading(false);
      })
      .catch(() => setYakLoading(false));
  }, [isExpanded, pkg.id, pkg.version, yakDetails]);

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
          </div>
          <ChevronDownIcon
            className={`ml-3 mt-1 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-300 dark:text-zinc-500 ${isExpanded ? "rotate-180" : ""
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
                  {yakLoading && (
                    <span className="text-[0.65rem] text-gray-400 dark:text-zinc-600 animate-pulse">Loading trends…</span>
                  )}
                  {yakDetails && (
                    <>
                      <TrendRow label="Last 24h" value={yakDetails.downloads.last_day} />
                      <TrendRow label="Last 7 days" value={yakDetails.downloads.last_week} />
                      <TrendRow label="Last 30 days" value={yakDetails.downloads.last_month} />
                    </>
                  )}
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

function TrendRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.65rem] text-gray-400 dark:text-zinc-500">{label}</span>
      <span className="text-[0.65rem] font-semibold text-gray-700 dark:text-zinc-300">{value.toLocaleString()}</span>
    </div>
  );
}

