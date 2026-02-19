import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { Switch } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { Filters } from "@/app/_components/api";
import { defaultParams, usePackageContext } from "./PackageContext";
import Spinner from "./Spinner";
import OwnersControl from "./OwnersControl";

export default function Sidebar() {
  const { navigate, status } = usePackageContext();

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
        onClick={() => navigate(defaultParams)}
        className="mt-6 flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 active:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
      >
        Reset filters
      </button>
      <div className="mt-6 flex min-h-[2.5rem] min-w-[2.5rem] flex-col items-center self-center">
        {status.isLoading && <Spinner />}
        {status.isError && <p className="text-center text-red-500 dark:text-red-400">{status.message}</p>}
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
      <Switch.Label as="label" className="flex cursor-pointer items-center gap-2 pr-3">
        <Image
          className={`inline h-[1.2rem] w-[1.2rem] opacity-80 ${isSvg ? "dark:invert" : ""}`}
          src={icon}
          width={32}
          height={32}
          alt={title}
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
            className={`${checked ? "bg-brand-500 dark:bg-brand-600" : "bg-gray-200 dark:bg-zinc-700"
              } relative inline-flex h-5 w-11 cursor-pointer rounded-full border-[0.125rem] border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950`}
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

  return (
    <div className="flex w-full rounded-md shadow-sm">
      <input
        type="text"
        placeholder="Search packages..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 transition-shadow focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-brand-500"
      />
    </div>
  );
}

function Sort() {
  const { navigate, controls } = usePackageContext();

  return (
    <div className="mt-1 flex w-full flex-col">
      <select
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
