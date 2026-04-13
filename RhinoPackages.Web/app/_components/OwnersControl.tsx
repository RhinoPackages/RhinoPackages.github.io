import { useMemo, useState, useRef } from "react";
import { ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Combobox } from "@headlessui/react";
import { Owner } from "./api";
import { usePackageContext } from "./PackageContext";

export default function OwnersControl() {
  const { controls, owners, navigate } = usePackageContext();
  const [filteredOwners, setFilteredOwners] = useState(owners);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => {
    if (!controls.owner) return null;
    return owners.find((owner) => owner.id === controls.owner) ?? null;
  }, [controls.owner, owners]);

  return (
    <Combobox
      as="div"
      value={selected}
      onChange={(value: Owner | null) => navigate({ owner: value?.id })}
      nullable
    >
      <div className="relative">
        <Combobox.Input
          ref={inputRef}
          className="w-full rounded-md border-0 bg-white py-2 pl-3 pr-14 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-shadow focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-brand-500"
          aria-label="Filter by author"
          placeholder="Search for author..."
          displayValue={(person: Owner | null) => person?.name ?? ""}
          onFocus={() => setFilteredOwners(owners)}
          onChange={(event) => {
            const query = event.target.value;
            const filtered = owners.filter((owner) =>
              owner.name.toLowerCase().includes(query.toLowerCase()),
            );
            setFilteredOwners(filtered);
          }}
        />
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate({ owner: undefined });
              setFilteredOwners(owners);
              inputRef.current?.focus();
            }}
            title="Clear author filter"
            aria-label="Clear author filter"
            className="absolute inset-y-1 right-8 flex items-center justify-center rounded-md px-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:focus-visible:ring-brand-400"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <Combobox.Button
          className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400"
          title="Toggle authors list"
          aria-label="Toggle authors list"
        >
          <ChevronUpDownIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
        </Combobox.Button>

        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-zinc-800 dark:ring-white/10">
          {filteredOwners.length === 0 ? (
            <div className="relative cursor-default select-none px-3 py-2 text-gray-500 dark:text-zinc-400">
              No authors found.
            </div>
          ) : (
            filteredOwners.map((person) => (
              <Combobox.Option
                key={person.id}
                value={person}
                className={({ selected, active }) =>
                  `truncate py-2 pl-3 cursor-pointer
                    ${active ? "bg-brand-500 text-white dark:bg-brand-600" : "text-gray-900 dark:text-zinc-300"}
                    ${selected ? "font-semibold text-brand-700 dark:text-brand-400" : "font-normal"}`
                }
              >
                {person.name}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}
