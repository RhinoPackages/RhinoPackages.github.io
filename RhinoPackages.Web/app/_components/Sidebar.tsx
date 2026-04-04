import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Switch } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Filters } from "@/app/_components/api";
import { defaultParams, usePackageContext } from "./PackageContext";
import Spinner from "./Spinner";
import OwnersControl from "./OwnersControl";

export default function Sidebar() {
  const { navigate, status, controls } = usePackageContext();

  const hasFilters =
    controls.filters !== defaultParams.filters ||
    controls.search !== defaultParams.search ||
    controls.owner !== defaultParams.owner ||
    controls.sort !== defaultParams.sort;

  return (
    <form
      action={() => navigate({})}
      className="sticky top-6 flex w-[12rem] flex-shrink-0 flex-col items-start gap-3"
    >
      <SearchBar />
      <OwnersControl />
      <Sort />
      <Spacer />
      <CheckBox title="Windows" icon="/icons/win.svg" filter={Filters.Windows} />
      <CheckBox title="Mac" icon="/icons/mac.svg" filter={Filters.Mac} />
      <Spacer />
      <CheckBox title="Rhino 6" icon="/icons/rhino6.png" filter={Filters.Rhino6} />
      <CheckBox title="Rhino 7" icon="/icons/rhino7.png" filter={Filters.Rhino7} />
      <CheckBox title="Rhino 8" icon="/icons/rhino8.png" filter={Filters.Rhino8} />
      <Spacer />
      <CheckBox title="Rhino plugin" icon="/icons/rhp.png" filter={Filters.Rhino} />
      <CheckBox title="Grasshopper" icon="/icons/gha.png" filter={Filters.Grasshopper} />
      <button
        type="button"
        disabled={!hasFilters}
        aria-disabled={!hasFilters}
        title={!hasFilters ? "No filters active" : "Reset all filters"}
        onClick={() => navigate(defaultParams)}
        className={`mt-6 flex w-full items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:focus-visible:ring-brand-400 ${
          !hasFilters
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-50 active:bg-gray-200 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
        }`}
      >
        Reset filters
      </button>

      <a
        href="https://rhinoversions.github.io"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-all hover:border-brand-500 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500 dark:hover:text-brand-400 dark:focus-visible:ring-brand-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
        Version Archive
      </a>
      <div className="mt-6 flex min-h-[2.5rem] min-w-[2.5rem] flex-col items-center self-center">
        {status.isLoading && <Spinner />}
        {status.isError && <p role="alert" aria-live="assertive" className="text-center text-red-500 dark:text-red-400">{status.message}</p>}
      </div>
    </form>
  );
}

function Spacer() {
  return <hr className="my-4 h-px w-full border-none bg-gray-200 dark:bg-zinc-800" />;
}

interface CheckProps {
  title: string;
  icon: string;
  filter: Filters;
}

function CheckBox({ title, icon, filter }: CheckProps) {
  const { navigateFilter, controls } = usePackageContext();
  const isSvg = icon.endsWith(".svg");

  const has = (constant: Filters) => {
    return constant === (controls.filters & constant);
  };

  return (
    <Switch.Group as="div" className="flex w-full items-center justify-between">
      <Switch.Label as="label" className="flex cursor-pointer items-center gap-2 pr-6">
        <Image
          className={`inline h-[1.2rem] w-[1.2rem] opacity-80 ${isSvg ? "dark:invert" : ""}`}
          src={icon}
          width={32}
          height={32}
          alt=""
          aria-hidden="true"
        />
        <span className="text-right text-sm text-gray-900 select-none dark:text-zinc-300">{title}</span>
      </Switch.Label>
      <Switch
        as={Fragment}
        checked={has(filter)}
        onChange={(checked) => navigateFilter(filter, checked)}
      >
        {({ checked }) => (
          <button
            type="button"
            aria-label={title}
            className={`${checked ? "bg-brand-500 dark:bg-brand-600" : "bg-gray-200 dark:bg-zinc-700"
              } relative inline-flex h-5 w-11 cursor-pointer rounded-full border-[0.125rem] border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950`}
          >
            <span
              aria-hidden="true"
              className={`${checked ? "translate-x-6" : "translate-x-0"
                } pointer-events-none absolute inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        )}
      </Switch>
    </Switch.Group>
  );
}

function SearchBar() {
  const { controls, navigate } = usePackageContext();
  const [localSearch, setLocalSearch] = useState(controls.search);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localSearch !== controls.search) {
        navigate({ search: localSearch });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [localSearch, controls.search, navigate]);

  useEffect(() => {
    setLocalSearch(controls.search);
  }, [controls.search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Blur on Escape if we're focused
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearSearch = () => {
    setLocalSearch("");
    navigate({ search: "" });
  };

  return (
    <div className="relative flex w-full rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        ref={inputRef}
        type="text"
        aria-label="Search packages (Press / to focus)"
        placeholder="Search packages..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="w-full rounded-md border-0 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 transition-shadow placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-brand-500"
      />
      {!localSearch && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <kbd className="hidden rounded border border-gray-200 px-1.5 font-sans text-[0.65rem] font-medium text-gray-400 dark:border-zinc-700 dark:text-zinc-500 sm:inline-block">
            /
          </kbd>
        </div>
      )}
      {localSearch && (
        <button
          type="button"
          onClick={clearSearch}
          title="Clear search"
          aria-label="Clear search"
          className="absolute inset-y-1 right-1 flex items-center justify-center rounded-md px-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-brand-400"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Sort() {
  const { navigate, controls } = usePackageContext();

  return (
    <div className="mt-1 flex w-full flex-col">
      <select
        aria-label="Sort packages by"
        className="rounded-md border-0 bg-white py-2 pl-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-shadow focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-brand-500"
        value={controls.sort}
        onChange={(e) => navigate({ sort: Number(e.target.value) })}
      >
        <option value={0}>Downloads</option>
        <option value={1}>Latest updates</option>
        <option value={2}>Trending</option>
      </select>
    </div>
  );
}
