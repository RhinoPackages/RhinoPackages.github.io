import { Sort, usePackageContext } from "./PackageContext";

/**
 * How the list is ordered. It sits on the results line rather than in the
 * filters, so it is on screen at every width, phones included, and the
 * visible label says what the select is for.
 */
export default function SortSelect() {
  const { navigate, controls } = usePackageContext();

  return (
    <div className="ml-auto flex flex-shrink-0 items-center gap-2">
      <label htmlFor="sort-packages" className="text-sm text-gray-500 dark:text-zinc-400">
        Sort
      </label>
      <select
        id="sort-packages"
        className="rounded-md border-0 bg-white py-2.5 pl-3 pr-8 text-base sm:py-2 sm:text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-shadow focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-brand-500"
        value={controls.sort}
        onChange={(e) => navigate({ sort: Number(e.target.value) })}
      >
        <option value={Sort.Downloads}>Downloads</option>
        <option value={Sort.Date}>Latest updates</option>
        <option value={Sort.Trending}>Trending</option>
        <option value={Sort.Rising}>Rising stars</option>
      </select>
    </div>
  );
}
