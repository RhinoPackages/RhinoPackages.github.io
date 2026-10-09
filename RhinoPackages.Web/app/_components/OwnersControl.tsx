import { useEffect, useId, useMemo, useState, useRef } from "react";
import { ChevronUpDownIcon, UserIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Combobox } from "@headlessui/react";
import { normalizeName } from "./api";
import type { AuthorRef } from "./packageInfo";
import { usePackageContext } from "./PackageContext";

/** Case- and accent-insensitive, so "sergio" finds "Sérgio". */
function fold(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * The only author control in the filters. Options are the same authors, in the
 * same A–Z order and with the same package counts, as /authors and the author
 * pages: `authors` comes from the server page, which groups multi-account
 * people into one entry.
 */
export default function OwnersControl() {
  const { authors, authorByName, ownerName, navigate } = usePackageContext();
  // The desktop sidebar and the phone's Filters sheet can each have one on the
  // page, so a fixed id would repeat.
  const inputId = useId();
  const [filteredAuthors, setFilteredAuthors] = useState(authors);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // By name, not by the id in the URL: someone with a second account can be
  // reached through either id, and ownerName resolves both to the same person.
  const selected = useMemo(() => {
    if (!ownerName) return null;
    return authorByName.get(normalizeName(ownerName)) ?? null;
  }, [ownerName, authorByName]);

  // The input shows the selected name, so text typed before the selection
  // changed (picked, or cleared from the results line or Reset) is stale.
  useEffect(() => {
    setQuery("");
    setFilteredAuthors(authors);
  }, [selected, authors]);

  // Room for what sits over the input's right edge, so text never runs under
  // it: just the chevron, plus the clear button, plus (from sm up) the Esc hint
  // while typing.
  const inputPadding = selected ? "pr-16" : query.length > 0 ? "pr-16 sm:pr-24" : "pr-10";

  return (
    <Combobox
      as="div"
      className="w-full"
      value={selected}
      onChange={(value: AuthorRef | null) => navigate({ owner: value?.id })}
      nullable
    >
      <label htmlFor={inputId} className="sr-only">
        Filter by author
      </label>
      <div className="group relative flex w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <UserIcon className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400" aria-hidden="true" />
        </div>
        <Combobox.Input
          id={inputId}
          ref={inputRef}
          spellCheck={false}
          autoComplete="off"
          className={`w-full rounded-md border-0 bg-white py-2.5 pl-10 sm:py-2 ${inputPadding} text-ellipsis text-base sm:text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-shadow placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:ring-zinc-700 dark:focus:ring-brand-500`}
          aria-label="Filter by author"
          aria-keyshortcuts="Escape"
          title={selected?.name ?? "Filter by author"}
          placeholder="Search for author..."
          displayValue={(author: AuthorRef | null) => author?.name ?? ""}
          onFocus={() => setFilteredAuthors(authors)}
          onChange={(event) => {
            const val = event.target.value;
            setQuery(val);
            const needle = fold(val);
            const filtered = authors.filter((author) => fold(author.name).includes(needle));
            setFilteredAuthors(filtered);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (selected || inputRef.current?.value) {
                // If there's a selection or text, clear it
                e.preventDefault();
                navigate({ owner: undefined });
                setFilteredAuthors(authors);
                setQuery("");
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              } else {
                // Otherwise blur
                inputRef.current?.blur();
              }
            }
          }}
        />
        {(selected || query.length > 0) && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate({ owner: undefined });
              setFilteredAuthors(authors);
              setQuery("");
              if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.focus();
              }
            }}
            title="Clear author filter"
            aria-label="Clear author filter"
            aria-keyshortcuts="Escape"
            className="absolute inset-y-1 right-8 flex items-center justify-center rounded-md px-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-brand-400"
          >
            {/* Only while typing: next to a selected name the hint would cover
                the end of it. */}
            {!selected && (
              <span className="hidden items-center gap-1 sm:flex">
                <kbd className="rounded border border-gray-200 px-1.5 font-sans text-[0.65rem] font-medium text-gray-500 dark:border-zinc-700 dark:text-zinc-400">Esc</kbd>
              </span>
            )}
            <XMarkIcon className={`h-4 w-4 ${selected ? "" : "sm:ml-1"}`} aria-hidden="true" />
          </button>
        )}
        <Combobox.Button
          className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400"
          title="Toggle authors list"
          aria-label="Toggle authors list"
        >
          <ChevronUpDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
        </Combobox.Button>

        <Combobox.Options className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800 dark:ring-white/10">
          {filteredAuthors.length === 0 ? (
            <div className="relative cursor-default select-none px-3 py-2 text-gray-500 dark:text-zinc-400">
              <span className="block font-medium text-gray-900 dark:text-zinc-100">
                {query ? `No authors found for "${query}"` : "No authors found"}
              </span>
              <span className="mt-0.5 block text-[0.65rem] text-gray-500 dark:text-zinc-400">
                {query ? "Check for typos or try a different name." : "Try searching for a different name."}
              </span>
            </div>
          ) : (
            filteredAuthors.map((author) => (
              <Combobox.Option
                key={author.slug}
                value={author}
                className={({ selected, active }) =>
                  `flex items-baseline gap-1 px-3 py-3 cursor-pointer md:py-2
                    ${active ? "bg-brand-600 text-white" : "text-gray-900 dark:text-zinc-300"}
                    ${selected ? "font-semibold" : "font-normal"}
                    ${selected && !active ? "text-brand-700 dark:text-brand-400" : ""}`
                }
              >
                <span className="min-w-0 truncate">{author.name}</span>
                <span className="flex-shrink-0 tabular-nums">· {author.count}</span>
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}
