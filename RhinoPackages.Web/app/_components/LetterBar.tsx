/**
 * The "jump to letter" bar of the A–Z index pages (/packages, /authors). Server
 * markup: plain in-page links, no script. Pinned to the top while the page
 * scrolls; `anchorFor` gives the id of each key's section.
 */
export default function LetterBar({ keys, anchorFor }: { keys: string[]; anchorFor: (key: string) => string }) {
  return (
    <nav aria-label="Jump to letter" className="sticky top-0 z-10 -mx-4 mt-6 bg-slate-50/95 px-4 py-1 backdrop-blur-sm sm:py-2 dark:bg-zinc-950/95">
      {/* One scrolling row below sm: wrapped, the bar is three rows (~108px) and
          covers the heading a tap jumps to. The padding keeps focus rings from
          being clipped by the scroll container; the right-edge fade (cleared by the
          end padding once scrolled) hints that more letters scroll. The links are
          44px targets on phones. */}
      <ul className="-m-0.5 flex flex-nowrap gap-1 overflow-x-auto p-0.5 pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pr-0.5 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
        {keys.map((key) => (
          <li key={key} className="shrink-0">
            <a
              href={`#${anchorFor(key)}`}
              className="inline-flex min-w-[2.75rem] items-center justify-center rounded-md px-2 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-brand-400 sm:min-w-[2rem] sm:py-1"
            >
              {key}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
