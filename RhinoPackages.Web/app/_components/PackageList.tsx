import Image from "next/image";
import {
  ArrowDownTrayIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  CalendarIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { pageResults, Filters, Package } from "@/app/_components/api";
import { usePackageContext } from "./PackageContext";

export default function PackageList() {
  const { controls, packages, navigate, stats } = usePackageContext();

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
          return <PackageCard key={pkg.id} pkg={pkg} />;
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

function PackageCard({ pkg }: { pkg: Package }) {
  const { navigate } = usePackageContext();

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

  return (
    <li className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-brand-700 dark:hover:bg-zinc-900/80 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:gap-0">
        <div className="flex gap-x-4">
          <Image
            className="h-[2.5rem] w-[2.5rem]"
            src={pkg.iconUrl}
            width={40}
            height={40}
            alt="Package icon"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                className="text-lg font-bold text-gray-900 decoration-brand-500 decoration-2 transition-colors hover:underline dark:text-zinc-100"
              >
                {pkg.id}
              </a>
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
                    onClick={() => navigate({ owner: owner.id })}
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
        <div className="flex w-full flex-shrink-0 flex-grow justify-between md:w-auto md:justify-end">
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
        </div>
      </div>
      <div className="mt-3 flex items-start gap-8">
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
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/50 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </li>
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
