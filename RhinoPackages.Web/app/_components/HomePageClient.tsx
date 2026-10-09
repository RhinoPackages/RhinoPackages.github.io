"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { PackageProvider, usePackageContext, drawerActive } from "./PackageContext";
import PackageList from "./PackageList";
import Sidebar, { ResetButton, SearchBar, SidebarFilters } from "./Sidebar";
import type { Package } from "./api";
import type { AuthorRef } from "./packageInfo";

export default function HomePageClient({
  initialCache = [],
  authors = [],
}: {
  initialCache?: Package[];
  authors?: AuthorRef[];
}) {
  // Only the filter controls differ between breakpoints; the list itself is
  // rendered once so cards are not mounted and diffed twice.
  return (
    <PackageProvider initialCache={initialCache} authors={authors}>
      {/* The divider is the sidebar column's right border, and the column
          stretches to the row's full height (no items-start here), so the line
          runs as far as the taller of sidebar and list instead of stopping
          where a short list ends. The column is display:none on phones, so no
          line is drawn there. */}
      <div className="flex w-full">
        <div className="hidden border-r border-gray-200 md:block dark:border-zinc-800">
          {/* Pinned while the list scrolls, and scrolls on its own when the
              window is shorter than the controls. Overflow clips at the padding
              box, so pl-1 keeps the chips' 2px focus outlines from being cut off
              on the left. */}
          <div className="pr-6 pt-6 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto md:pl-1">
            <Sidebar />
          </div>
        </div>
        <div className="min-w-0 flex-1 md:pl-6">
          {/* Sticky here, not inside MobileSearchBar: a sticky element only
              sticks within its parent, and this wrapper is the list column. */}
          <div className="sticky top-0 z-20 md:hidden">
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
 * opens the rest of the sidebar controls (author, platform, versions, etc.)
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
  const { controls, filteredCount, totalPackages } = usePackageContext();

  // The dot is for what is inside the sheet. Search and keyword narrow the
  // list too, but they are not in there, so they do not light it.
  const hasFilters = drawerActive(controls);

  useEffect(() => setMounted(true), []);

  // The page's floating scroll-to-top button would sit over the sheet's
  // footer. The attribute lets CSS hide it (see globals.css) without the
  // button reading any state; the cleanup also runs if this unmounts open.
  useEffect(() => {
    if (!open) return;
    document.body.dataset.sheet = "open";
    return () => {
      delete document.body.dataset.sheet;
    };
  }, [open]);

  const closeSheet = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  // "Show 1,275 packages": the count the list will have once the sheet closes.
  const showLabel =
    totalPackages === 0
      ? "Show packages"
      : `Show ${filteredCount.toLocaleString()} ${filteredCount === 1 ? "package" : "packages"}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // A control inside the sheet that already used this Escape (the author
      // box clearing its text) calls preventDefault; that press is not also
      // "close the sheet".
      if (e.key === "Escape" && open && !e.defaultPrevented) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="-mx-4 flex items-center gap-2 bg-slate-50/95 px-4 py-3 backdrop-blur-sm dark:bg-zinc-950/95">
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
              onClick={closeSheet}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white px-6 pt-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Filters</span>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Close filters"
                  title="Close filters"
                  className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarFilters inSheet />
              {/* Pinned to the sheet's bottom edge, so the way out is on
                  screen however far the chips scroll. Opaque, and as wide as
                  the sheet, so nothing shows through or around it. */}
              <div className="sticky bottom-0 -mx-6 mt-4 flex items-center gap-2 border-t border-gray-200 bg-white px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={closeSheet}
                  className="flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-brand-600 dark:hover:bg-brand-500 dark:focus-visible:ring-brand-400 dark:focus-visible:ring-offset-zinc-950"
                >
                  {showLabel}
                </button>
                <ResetButton className="min-h-[2.75rem] flex-shrink-0 whitespace-nowrap px-4" />
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
