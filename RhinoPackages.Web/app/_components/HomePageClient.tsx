"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { PackageProvider, usePackageContext, hasActiveFilters } from "./PackageContext";
import PackageList from "./PackageList";
import Sidebar, { SearchBar, SidebarFilters } from "./Sidebar";
import type { Package } from "./api";

export default function HomePageClient({ initialCache = [] }: { initialCache?: Package[] }) {
  // Only the filter controls differ between breakpoints; the list itself is
  // rendered once so cards are not mounted and diffed twice.
  return (
    <PackageProvider initialCache={initialCache}>
      {/* The divider belongs to the sidebar, which is hidden on phones. It
          has to be gated on the breakpoint too: Tailwind's divide-x skips
          elements with the hidden *attribute*, not the class, so on a phone
          the rule still drew a full-height line beside the card borders. */}
      <div className="flex w-full items-start md:divide-x md:divide-gray-200 dark:md:divide-zinc-800">
        <div className="hidden pr-6 pt-6 md:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1 md:pl-6">
          <div className="md:hidden">
            <MobileSearchBar />
          </div>
          <PackageList />
        </div>
      </div>
    </PackageProvider>
  );
}

/**
 * Phone-only header: the search box stays on screen (sticky) instead of
 * being tucked behind a hamburger, with a "Filters" button next to it that
 * opens the rest of the sidebar controls (sort, platform, versions, etc.)
 * in a bottom sheet.
 */
function MobileSearchBar() {
  const [open, setOpen] = useState(false);
  // Portal target: rendering the sheet where it's declared would nest it
  // inside this bar's `backdrop-blur`, which (like `transform`) creates a
  // containing block that hijacks `position: fixed` descendants — the sheet
  // would then dock to this bar's box instead of the viewport. Also false
  // during server rendering, since `document` doesn't exist there.
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { controls } = usePackageContext();

  const hasFilters = hasActiveFilters(controls);

  useEffect(() => setMounted(true), []);

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
    <div className="sticky top-0 z-20 -mx-4 flex items-center gap-2 bg-slate-50/95 px-4 py-3 backdrop-blur-sm dark:bg-zinc-950/95">
      <div className="min-w-0 flex-1">
        <SearchBar />
      </div>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={hasFilters ? "Open filters (active filters applied)" : "Open filters"}
        title={hasFilters ? "Open filters (active filters applied)" : "Open filters"}
        className="relative flex flex-shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-brand-400"
      >
        <FunnelIcon className="h-4 w-4" aria-hidden="true" />
        Filters
        {hasFilters && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-slate-50 dark:ring-zinc-950" />
        )}
      </button>
      {open &&
        mounted &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white px-6 pb-8 pt-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Filters</span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  aria-label="Close filters"
                  title="Close filters"
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarFilters />
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
