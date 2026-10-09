/** One labelled figure in a page's facts grid (a <dl> of these). Server-rendered. */
export default function Fact({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="pkg-label">{label}</dt>
      <dd className="break-long-words text-sm font-medium text-gray-900 dark:text-zinc-100">
        {value}
        {hint && <span className="pkg-muted block font-normal">{hint}</span>}
      </dd>
    </div>
  );
}
