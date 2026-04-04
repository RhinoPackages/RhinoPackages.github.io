export default function Spinner() {
  return (
    <div
      className={
        "inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-r-brand-500 motion-reduce:animate-[spin_1.5s_linear_infinite] dark:border-zinc-700 dark:border-r-brand-400"
      }
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
