import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Switch } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Filters, formatDate } from "@/app/_components/api";
import { defaultParams, isNarrowed, usePackageContext } from "./PackageContext";
import OwnersControl from "./OwnersControl";
import { statusDefinitions } from "./packageInfo";

export default function Sidebar() {
  const { navigate } = usePackageContext();

  return (
    <form
      role="search"
      action={() => navigate({})}
      className="flex w-[14rem] flex-shrink-0 flex-col items-start gap-3"
    >
      <SearchBar />
      <SidebarFilters />
    </form>
  );
}

/**
 * Everything but the search box: the author picker, platform/version/type
 * chips, the two status switches and reset. Controls here only narrow the
 * list; ordering lives on the results line. Split out from the search box so
 * the mobile sticky bar can show search directly and put the rest behind a
 * "Filters" sheet instead of hiding both behind one hamburger toggle.
 *
 * `inSheet` leaves Reset out: the sheet pins its own footer with Reset and
 * "Show N packages", which have to stay on screen however far the chips scroll.
 */
export function SidebarFilters({ inSheet = false }: { inSheet?: boolean }) {
  const { status } = usePackageContext();

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <OwnersControl />
      <ChipGroup legend="Platform">
        <FilterChip label="Windows" filter={Filters.Windows} />
        <FilterChip label="Mac" filter={Filters.Mac} />
      </ChipGroup>
      <ChipGroup legend="Rhino">
        <FilterChip label="6" name="Rhino 6" filter={Filters.Rhino6} />
        <FilterChip label="7" name="Rhino 7" filter={Filters.Rhino7} />
        <FilterChip label="8" name="Rhino 8" filter={Filters.Rhino8} />
        <FilterChip label="9 WIP" name="Rhino 9 WIP" filter={Filters.Rhino9} />
      </ChipGroup>
      <ChipGroup legend="Type">
        <FilterChip label="Rhino" filter={Filters.Rhino} />
        <FilterChip label="Grasshopper" filter={Filters.Grasshopper} />
      </ChipGroup>
      <fieldset className="flex w-full flex-col gap-3">
        <legend className={legendClass}>Status</legend>
        <StatusToggle
          title="Maintained"
          param="maintained"
          hint={statusDefinitions.maintained}
        />
        <StatusToggle
          title="No Rhino 8+ build"
          param="deprecated"
          hint={statusDefinitions.noRhino8}
        />
        <a
          href="/faq#status"
          className="pkg-quiet-link self-start py-1 text-xs text-gray-500 dark:text-zinc-400"
        >
          What do these mean?
        </a>
      </fieldset>
      {!inSheet && <ResetButton className="mt-2 w-full px-3 py-1.5" />}

      {status.isError && (
        <div className="mt-6 flex min-h-[2.5rem] min-w-[2.5rem] flex-col items-center self-center">
          <p
            role="alert"
            aria-live="assertive"
            className="text-center text-red-500 dark:text-red-400"
          >
            {status.message}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The footer's data date and Rhino Version Archive link, repeated beside the
 * filters. The list scrolls without end, so on the home page the footer is
 * effectively out of reach, and these two would not be reachable at all.
 */
export function SiteNote({ dataDate }: { dataDate?: string }) {
  return (
    <div className="flex flex-col items-start gap-1 text-xs text-gray-500 dark:text-zinc-400">
      {dataDate && (
        <a href="/faq#updates" className="pkg-quiet-link py-1">
          Data updated {formatDate(dataDate)}
        </a>
      )}
      <a
        href="https://rhinoversions.github.io"
        target="_blank"
        rel="noopener noreferrer"
        className="pkg-quiet-link py-1"
      >
        Rhino Version Archive
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}

/**
 * Clears every param, search and keyword included. Dimmed rather than removed
 * while nothing narrows the list, so the layout does not jump. `className`
 * carries the size, which differs between the sidebar and the sheet footer.
 */
export function ResetButton({ className }: { className: string }) {
  const { navigate, controls } = usePackageContext();
  const narrowed = isNarrowed(controls);

  return (
    <button
      type="button"
      aria-disabled={!narrowed}
      title={!narrowed ? "No filters active" : "Reset all filters"}
      onClick={(e) => {
        if (!narrowed) {
          e.preventDefault();
          return;
        }
        navigate(defaultParams);
      }}
      className={`flex items-center justify-center rounded-md bg-white text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 dark:focus-visible:ring-brand-400 ${className} ${
        !narrowed
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-gray-50 active:bg-gray-200 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
      }`}
    >
      Reset filters
    </button>
  );
}

const legendClass = "mb-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400";

/** A labelled row of chips; the visible legend names the group for everyone. */
function ChipGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="w-full">
      <legend className={legendClass}>{legend}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

interface ChipProps {
  /** Visible text. */
  label: string;
  /** Spoken name when the visible text alone is ambiguous: "Rhino 6" for "6". Always contains `label`. */
  name?: string;
  filter: Filters;
}

/** One ?filters= bit as a toggle button. Selected chips also get a heavier ring, so colour is not the only cue. */
function FilterChip({ label, name, filter }: ChipProps) {
  const { navigateFilter, controls } = usePackageContext();
  const pressed = filter === (controls.filters & filter);

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={name}
      onClick={() => navigateFilter(filter, !pressed)}
      className={`min-h-[2.75rem] min-w-[2.75rem] cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium ring-inset transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 md:min-h-0 md:min-w-0 dark:focus-visible:outline-brand-400 ${
        pressed
          ? "bg-brand-100 text-brand-800 ring-2 ring-brand-500 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-400"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/50 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
      }`}
    >
      {label}
    </button>
  );
}

function StatusToggle({
  title,
  param,
  hint,
}: {
  title: string;
  param: "maintained" | "deprecated";
  hint: string;
}) {
  const { navigate, controls } = usePackageContext();

  return (
    <Toggle
      title={title}
      hint={hint}
      checked={controls[param]}
      onChange={(checked) => navigate({ [param]: checked })}
    />
  );
}

// The off track's border is what separates it from the sidebar (3:1 or more in
// both themes); the fill alone is too close to the background to see.
function Toggle({
  title,
  checked,
  onChange,
  hint,
}: {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <Switch.Group as="div" className="flex min-h-[2.75rem] w-full items-center justify-between md:min-h-0">
      <Switch.Label
        as="label"
        className="flex min-w-0 flex-1 cursor-pointer select-none items-center self-stretch pr-3 text-sm text-gray-900 dark:text-zinc-300"
        title={hint}
      >
        {title}
      </Switch.Label>
      <Switch as={Fragment} checked={checked} onChange={onChange}>
        {({ checked }) => (
          <button
            type="button"
            aria-label={title}
            className={`${
              checked
                ? "border-transparent bg-brand-500 dark:bg-brand-600"
                : "border-gray-500 bg-gray-200 dark:border-zinc-500 dark:bg-zinc-700"
            } relative inline-flex h-5 w-11 flex-shrink-0 cursor-pointer rounded-full border-[0.125rem] transition-colors duration-200 ease-in-out before:absolute before:inset-x-0 before:-inset-y-3 md:before:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950`}
          >
            <span
              aria-hidden="true"
              className={`${
                checked ? "translate-x-6" : "translate-x-0"
              } pointer-events-none absolute inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        )}
      </Switch>
    </Switch.Group>
  );
}

export function SearchBar() {
  const { controls, navigate } = usePackageContext();
  // The desktop sidebar and the phone's sticky bar each mount one, so a fixed
  // id would be on the page twice.
  const inputId = useId();
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
        if (
          inputRef.current &&
          inputRef.current.offsetWidth > 0 &&
          window.getComputedStyle(inputRef.current).display !== "none"
        ) {
          e.preventDefault();
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clearSearch = () => {
    setLocalSearch("");
    navigate({ search: "" });
    inputRef.current?.focus();
  };

  return (
    <div className="group relative flex w-full rounded-md shadow-sm">
      <label htmlFor={inputId} className="sr-only">
        Search packages
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon
          className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400"
          aria-hidden="true"
        />
      </div>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        role="searchbox"
        spellCheck={false}
        autoComplete="off"
        aria-label="Search packages (Press / to focus)"
        aria-keyshortcuts="/"
        title="Search packages (Press / to focus)"
        placeholder="Search packages..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (localSearch) {
              e.preventDefault();
              clearSearch();
            } else {
              inputRef.current?.blur();
            }
          }
        }}
        className="w-full rounded-md border-0 bg-white py-2.5 pl-10 pr-14 text-base sm:py-2 sm:text-sm text-gray-900 ring-1 ring-inset ring-gray-300 transition-shadow placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:ring-zinc-700 dark:focus:ring-brand-500"
      />
      {!localSearch && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <kbd className="hidden rounded border border-gray-200 px-1.5 font-sans text-[0.65rem] font-medium text-gray-500 group-focus-within:hidden dark:border-zinc-700 dark:text-zinc-400 sm:inline-block">
            /
          </kbd>
        </div>
      )}
      {localSearch && (
        <button
          type="button"
          onClick={clearSearch}
          title="Clear search (Esc)"
          aria-label="Clear search (Esc)"
          aria-keyshortcuts="Escape"
          className="absolute inset-y-1 right-1 flex items-center justify-center rounded-md px-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-brand-400"
        >
          <span className="hidden items-center gap-1 sm:flex">
            <kbd className="rounded border border-gray-200 px-1.5 font-sans text-[0.65rem] font-medium text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
              Esc
            </kbd>
          </span>
          <XMarkIcon className="h-5 w-5 sm:ml-1" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
