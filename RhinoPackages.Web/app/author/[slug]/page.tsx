import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Squares2X2Icon } from "@heroicons/react/24/solid";
import PackageIcon from "@/app/_components/PackageIcon";
import { openGraphDefaults, siteUrl, twitterDefaults } from "@/app/_components/seo";
import { authorPath, findAuthor, isIndexedAuthor, loadAuthors } from "@/app/_components/authors";
import { Filters, Package, formatDate, has, isDeprecated } from "@/app/_components/packageModel";
import { iconSrc, joinWithAnd, packagePath, pluginKind, truncate } from "@/app/_components/packageInfo";

type Params = { params: { slug: string } };

// One page per author, all exported at build time. Anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return loadAuthors().map((author) => ({ slug: author.slug }));
}

function kindsOf(packages: Package[]) {
  const rhino = packages.some((pkg) => has(Filters.Rhino, pkg));
  const grasshopper = packages.some((pkg) => has(Filters.Grasshopper, pkg));
  if (rhino && grasshopper) return "Rhino and Grasshopper plugins";
  if (grasshopper) return "Grasshopper plugins";
  if (rhino) return "Rhino plugins";
  return "Rhino packages";
}

export function generateMetadata({ params }: Params): Metadata {
  const author = findAuthor(params.slug);
  if (!author) return {};

  const count = author.packages.length;
  const title = `${author.name} – ${count} ${count === 1 ? "Rhino package" : kindsOf(author.packages)}`;
  const top = author.packages.slice(0, 5).map((pkg) => pkg.id);
  const downloads = author.packages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  const description = truncate(
    `${count === 1 ? "The package" : `All ${count} packages`} by ${author.name} on Rhino's Yak package manager` +
      `${top.length > 0 ? `, including ${joinWithAnd(top)}` : ""}. ` +
      `${downloads.toLocaleString("en-US")} downloads in total, with versions, compatibility and install instructions.`,
    300,
  );
  const path = authorPath(author.slug);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: isIndexedAuthor(author) ? undefined : { index: false, follow: true },
    openGraph: { ...openGraphDefaults, url: `${siteUrl}${path}`, title: `${title} | Rhino Packages`, description },
    twitter: { ...twitterDefaults, title: `${title} | Rhino Packages`, description },
  };
}

export default function AuthorPage({ params }: Params) {
  const author = findAuthor(params.slug);
  if (!author) notFound();

  const { packages } = author;
  const downloads = packages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  const weekly = packages.reduce((sum, pkg) => sum + (pkg.downloadsWeek ?? 0), 0);
  const lastUpdated = packages.reduce<string | undefined>(
    (latest, pkg) => (!latest || pkg.updated > latest ? pkg.updated : latest),
    undefined,
  );
  const firstReleased = packages.reduce<string | undefined>(
    (first, pkg) => (pkg.firstReleased && (!first || pkg.firstReleased < first) ? pkg.firstReleased : first),
    undefined,
  );
  const credited = packages.length - author.owned;
  const path = authorPath(author.slug);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Rhino Packages", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Authors", item: `${siteUrl}/authors` },
        { "@type": "ListItem", position: 3, name: author.name, item: `${siteUrl}${path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: `${siteUrl}${path}`,
      mainEntity: {
        "@type": "Person",
        name: author.name,
        url: `${siteUrl}${path}`,
      },
      hasPart: {
        "@type": "ItemList",
        numberOfItems: packages.length,
        itemListElement: packages.map((pkg, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}${packagePath(pkg.id)}`,
          name: pkg.id,
        })),
      },
    },
  ];

  return (
    <article className="mx-auto mt-6 max-w-4xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-zinc-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <a href="/" className="pkg-link">Rhino Packages</a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/authors" className="pkg-link">Authors</a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="break-long-words font-medium text-gray-700 dark:text-zinc-300">
            {author.name}
          </li>
        </ol>
      </nav>

      <header className="mt-6">
        <h1 className="break-long-words text-3xl font-bold text-gray-900 dark:text-zinc-100">{author.name}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
          {packages.length === 1 ? "1 package" : `${packages.length} ${kindsOf(packages)}`} on Rhino&apos;s Yak
          package manager
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a href={`/?owner=${author.id}`} className="pkg-button">
          <Squares2X2Icon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
          Filter the directory
        </a>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-3 lg:grid-cols-5">
        <Fact
          label="Packages"
          value={packages.length.toLocaleString("en-US")}
          hint={credited > 0 ? `${author.owned} published · ${credited} credited` : undefined}
        />
        <Fact label="Total downloads" value={downloads.toLocaleString("en-US")} />
        <Fact label="Recent downloads" value={`+${weekly.toLocaleString("en-US")} / week`} />
        <Fact label="First release" value={firstReleased ? formatDate(firstReleased) : "—"} />
        <Fact label="Last update" value={lastUpdated ? formatDate(lastUpdated) : "—"} />
      </dl>

      <section aria-labelledby="packages" className="mt-10">
        <h2 id="packages" className="pkg-heading">Packages by {author.name}</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <a href={packagePath(pkg.id)} className="pkg-card">
                <PackageIcon className="h-8 w-8 flex-shrink-0 rounded-sm" src={iconSrc(pkg.iconUrl)} size={32} />
                <span className="min-w-0">
                  <span className="break-long-words block text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    {pkg.id}
                    {isDeprecated(pkg) && <span className="pkg-muted font-normal"> · deprecated</span>}
                  </span>
                  <span className="pkg-muted block">
                    {pluginKind(pkg)} · v{pkg.version} · {pkg.downloads.toLocaleString("en-US")} downloads
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs text-gray-500 dark:text-zinc-400">
        Includes packages {author.name} publishes on Yak and packages that credit them as an author. Data comes
        from Rhino&apos;s <a href="https://yak.rhino3d.com" className="pkg-link">Yak package manager</a> and is
        refreshed every few hours. <a href="/authors" className="pkg-link">Browse all authors</a>.
      </p>
    </article>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
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
