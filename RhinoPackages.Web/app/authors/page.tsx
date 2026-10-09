import type { Metadata } from "next";
import { Author, authorPath, isIndexedAuthor, loadAuthors } from "@/app/_components/authors";
import { packagePath } from "@/app/_components/packageInfo";
import { openGraphDefaults, siteUrl, twitterDefaults } from "@/app/_components/seo";

export function generateMetadata(): Metadata {
  const count = loadAuthors().length.toLocaleString("en-US");
  const title = "Rhino & Grasshopper Plugin Authors A–Z";
  const description = `All ${count} developers and studios publishing Rhino 3D and Grasshopper plugins on the Yak package manager, each with their packages and download totals.`;

  return {
    title,
    description,
    alternates: { canonical: "/authors" },
    openGraph: { ...openGraphDefaults, url: `${siteUrl}/authors`, title: `${title} | Rhino Packages`, description },
    twitter: { ...twitterDefaults, title: `${title} | Rhino Packages`, description },
  };
}

/** "A".."Z" for names starting with a Latin letter, "#" for everything else. */
function groupKey(name: string) {
  const first = name.normalize("NFKD").charAt(0).toUpperCase();
  return first >= "A" && first <= "Z" ? first : "#";
}

function anchorFor(key: string) {
  return key === "#" ? "other" : key;
}

export default function AuthorsIndexPage() {
  const authors = loadAuthors();

  const groups = new Map<string, Author[]>();
  for (const author of authors) {
    const key = groupKey(author.name);
    groups.set(key, [...(groups.get(key) ?? []), author]);
  }
  const keys = Array.from(groups.keys()).sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));

  return (
    <div className="mx-auto mt-6 max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Rhino &amp; Grasshopper plugin authors</h1>
      <p className="mt-3 max-w-3xl leading-relaxed text-gray-600 dark:text-zinc-400">
        The {authors.length.toLocaleString("en-US")} developers and studios publishing packages on Rhino&apos;s Yak
        package manager, A to Z. Each page lists everything they publish or are credited on; an author with a single
        package links straight to it. Looking for a plugin instead? Browse <a href="/packages" className="pkg-link">all packages</a> or search the{" "}
        <a href="/" className="pkg-link">directory</a>.
      </p>

      <nav aria-label="Jump to letter" className="sticky top-0 z-10 -mx-4 mt-6 bg-slate-50/95 px-4 py-2 backdrop-blur-sm dark:bg-zinc-950/95">
        {/* One scrolling row below sm: wrapped, the bar is three rows (~108px) and
            covers the heading a tap jumps to. The padding keeps focus rings from
            being clipped by the scroll container; the right-edge fade (cleared by the
            end padding once scrolled) hints that more letters scroll. */}
        <ul className="-m-0.5 flex flex-nowrap gap-1 overflow-x-auto p-0.5 pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pr-0.5 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
          {keys.map((key) => (
            <li key={key} className="shrink-0">
              <a
                href={`#${anchorFor(key)}`}
                className="inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-1 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-brand-400"
              >
                {key}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {keys.map((key) => (
        <section key={key} id={anchorFor(key)} aria-labelledby={`heading-${anchorFor(key)}`} className="mt-8 scroll-mt-16 sm:scroll-mt-20">
          <h2
            id={`heading-${anchorFor(key)}`}
            className="border-b border-gray-200 pb-2 text-xl font-bold text-gray-900 dark:border-zinc-800 dark:text-zinc-100"
          >
            {key}
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {(groups.get(key) ?? []).map((author) => (
              <li key={author.slug} className="min-w-0 text-sm">
                {isIndexedAuthor(author) ? (
                  <>
                    <a href={authorPath(author.slug)} className="pkg-link break-long-words font-medium">
                      {author.name}
                    </a>
                    <span className="pkg-muted"> · {author.packages.length} packages</span>
                  </>
                ) : (
                  // One package: its page says everything the author page would, so link there.
                  <>
                    <span className="break-long-words font-medium text-gray-900 dark:text-zinc-100">{author.name}</span>
                    <span className="pkg-muted"> · </span>
                    <a href={packagePath(author.packages[0].id)} className="pkg-link break-long-words">
                      {author.packages[0].id}
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
