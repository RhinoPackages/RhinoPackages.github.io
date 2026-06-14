"use client";

import { useState, useEffect, useRef } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid";
import { PackageProvider, usePackageContext, defaultParams } from "./PackageContext";
import PackageList from "./PackageList";
import Sidebar from "./Sidebar";
import type { Package } from "./api";

export default function HomePageClient({ initialCache = [] }: { initialCache?: Package[] }) {
  return (
    <PackageProvider initialCache={initialCache}>
      <div className="hidden w-full items-start divide-x divide-gray-200 dark:divide-zinc-800 md:flex">
        <div className="pr-6 pt-6">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 pl-6">
          <PackageList />
        </div>
      </div>
      <div className="md:hidden">
        <ToggleMenu />
      </div>
    </PackageProvider>
  );
}

function ToggleMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const Icon = open ? XMarkIcon : Bars3Icon;
  const { controls } = usePackageContext();

  const hasFilters =
    controls.filters !== defaultParams.filters ||
    controls.search !== defaultParams.search ||
    controls.owner !== defaultParams.owner ||
    controls.sort !== defaultParams.sort;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative mt-4 flex w-full flex-col">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close filters" : (hasFilters ? "Open filters (active filters applied)" : "Open filters")}
        title={open ? "Close filters" : (hasFilters ? "Open filters (active filters applied)" : "Open filters")}
        className="z-20 relative self-start rounded-md p-1 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-brand-400"
      >
        <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
        {!open && hasFilters && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-zinc-950" />
        )}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[5] bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setOpen(false);
              buttonRef.current?.focus();
            }}
            aria-hidden="true"
          />
          <div className="absolute -left-1 -top-1 z-10 max-h-[calc(100vh-2rem)] overflow-y-auto border border-gray-200 bg-white px-8 py-10 shadow dark:border-zinc-800 dark:bg-zinc-950">
            <Sidebar />
          </div>
        </>
      )}
      <PackageList />
    </div>
  );
}
