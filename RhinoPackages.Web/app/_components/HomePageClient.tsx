"use client";

import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid";
import { PackageProvider } from "./PackageContext";
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
  const Icon = open ? XMarkIcon : Bars3Icon;

  return (
    <div className="relative mt-4 flex w-full flex-col">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close filters" : "Open filters"}
        className="z-20 self-start rounded-md p-1 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-brand-400"
      >
        <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute -left-1 -top-1 z-10 border border-gray-200 bg-white px-8 pt-10 shadow dark:border-zinc-800 dark:bg-zinc-950">
          <Sidebar />
        </div>
      )}
      <PackageList />
    </div>
  );
}
