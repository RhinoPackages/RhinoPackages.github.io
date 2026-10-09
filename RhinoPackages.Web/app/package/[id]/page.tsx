import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import PackageIcon from "@/app/_components/PackageIcon";
import { openGraphDefaults, siteUrl, twitterDefaults } from "@/app/_components/seo";
import { timePositions } from "@/app/_components/chart";
import {
  findPackage,
  loadDownloadHistory,
  loadPackages,
  loadVersionHistory,
} from "@/app/_components/packageData";
import {
  Distribution,
  Filters,
  HistoryPoint,
  Package,
  formatDate,
  has,
  isDeprecated,
  isMaintained,
} from "@/app/_components/packageModel";
import { Author, authorPath, findAuthorByName } from "@/app/_components/authors";
import {
  YakPlatform,
  formatBytes,
  formatCadence,
  formatDistributionTarget,
  groupVersionHistory,
  hasDescription,
  iconSrc,
  keywordsOf,
  latestDistributions,
  packageDescription,
  packagePath,
  packageTitle,
  packagesBySameOwners,
  parseWebsiteAction,
  platformLabel,
  pluginKind,
  relatedPackages,
  yakInstallCommand,
  yakRhinoRelease,
} from "@/app/_components/packageInfo";

// The version history table stops here; the rest is a click away in the directory.
const maxVersionRows = 40;

type Params = { params: { id: string } };

// One page per package, all exported at build time. Anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return loadPackages().map((pkg) => ({ id: pkg.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const pkg = findPackage(params.id);
  if (!pkg) return {};

  const title = packageTitle(pkg);
  const description = packageDescription(pkg);
  const path = packagePath(pkg.id);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...openGraphDefaults,
      url: `${siteUrl}${path}`,
      title: `${title} | Rhino Packages`,
      description,
    },
    twitter: {
      ...twitterDefaults,
      title: `${title} | Rhino Packages`,
      description,
    },
  };
}

export default function PackagePage({ params }: Params) {
  const pkg = findPackage(params.id);
  if (!pkg) notFound();

  const all = loadPackages();
  const versionHistory = loadVersionHistory(pkg.id);
  const downloadHistory = loadDownloadHistory(pkg.id);

  const builds = latestDistributions(pkg, versionHistory);
  const versionRows = groupVersionHistory(versionHistory);
  const { websiteHref, emailHref } = parseWebsiteAction(pkg.homepageUrl);
  const keywords = keywordsOf(pkg);
  const installLink = `rhino://package/search?name=${pkg.id}`;

  const releaseTimes = versionHistory
    .map((v) => new Date(v.createdAt).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  const maintained = isMaintained(pkg, Date.now(), releaseTimes[releaseTimes.length - 1]);
  const deprecated = isDeprecated(pkg);
  const releaseCount = releaseTimes.length || pkg.versionCount || 0;
  const firstReleased = releaseTimes.length > 0 ? new Date(releaseTimes[0]) : pkg.firstReleased ? new Date(pkg.firstReleased) : null;

  // Credited authors who also publish on Yak link to their author page.
  const authors = pkg.authors
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, page: findAuthorByName(name) }));
  const publishers = pkg.owners
    .map((owner) => findAuthorByName(owner.name))
    .filter((author): author is Author => author !== undefined)
    .filter((author, i, list) => list.findIndex((other) => other.slug === author.slug) === i);

  const sameOwners = packagesBySameOwners(pkg, all, 8);
  const related = relatedPackages(pkg, all, 8, new Set(sameOwners.map((p) => p.id)));
  const commandPlatforms: YakPlatform[] = [
    has(Filters.Windows, pkg) ? ("windows" as const) : null,
    has(Filters.Mac, pkg) ? ("mac" as const) : null,
  ].filter((p): p is YakPlatform => p !== null);
  const rhinoRelease = yakRhinoRelease(pkg);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Rhino Packages", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "All packages", item: `${siteUrl}/packages` },
      { "@type": "ListItem", position: 3, name: pkg.id, item: `${siteUrl}${packagePath(pkg.id)}` },
    ],
  };

  return (
    <article className="mx-auto mt-6 max-w-4xl">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-zinc-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <a href="/" className="pkg-link">Rhino Packages</a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/packages" className="pkg-link">All packages</a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="break-long-words font-medium text-gray-700 dark:text-zinc-300">
            {pkg.id}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mt-6 flex gap-4">
        <PackageIcon className="h-14 w-14 flex-shrink-0 rounded-md" src={iconSrc(pkg.iconUrl)} size={56} />
        <div className="min-w-0">
          <h1 className="break-long-words text-3xl font-bold text-gray-900 dark:text-zinc-100">{pkg.id}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            {pluginKind(pkg)} · <span className="font-semibold">v{pkg.version}</span> · updated{" "}
            <time dateTime={pkg.updated}>{formatDate(pkg.updated)}</time>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pkg.prerelease && <Pill tone="yellow">Pre-release</Pill>}
            {deprecated && <Pill tone="rose">Deprecated · no Rhino 8 build</Pill>}
            {!maintained && <Pill tone="amber">No release in over a year</Pill>}
          </div>
        </div>
      </header>

      {/* Description */}
      {hasDescription(pkg) ? (
        <p className="break-long-words mt-6 whitespace-pre-line leading-relaxed text-gray-700 dark:text-zinc-300">
          {pkg.description}
        </p>
      ) : (
        <p className="mt-6 italic text-gray-500 dark:text-zinc-400">No description provided.</p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={installLink}
          title={`Install ${pkg.id} in Rhino`}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 dark:focus-visible:ring-white/30"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
          Install in Rhino
        </a>
        {builds.length === 1 && (
          <a
            href={builds[0].url}
            download={builds[0].filename}
            title={`Download ${builds[0].filename} (${formatDistributionTarget(builds[0])})`}
            className="pkg-button"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
            Download .yak
          </a>
        )}
        {websiteHref && (
          <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="pkg-button">
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
            Website<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {emailHref && (
          <a href={emailHref} className="pkg-button">
            <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
            Email the author
          </a>
        )}
        <a href={`/?p=${encodeURIComponent(pkg.id)}`} className="pkg-button">
          <Squares2X2Icon className="h-4 w-4 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
          Open in directory
        </a>
      </div>
      {builds.length > 1 && (
        <div className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
            Download v{pkg.version}
          </h2>
          <DistributionLinks distributions={builds} />
        </div>
      )}

      {/* Facts */}
      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-3 lg:grid-cols-4">
        <Fact label="Total downloads" value={pkg.downloads.toLocaleString("en-US")} />
        <Fact
          label="Recent downloads"
          value={`+${(pkg.downloadsWeek ?? 0).toLocaleString("en-US")} / week`}
          hint={`+${(pkg.downloadsMonth ?? 0).toLocaleString("en-US")} in the last month`}
        />
        <Fact label="Latest version" value={`v${pkg.version}`} hint={formatDate(pkg.updated)} />
        <Fact
          label="Releases"
          value={releaseCount > 0 ? releaseCount.toLocaleString("en-US") : "—"}
          hint={pkg.releaseCadenceDays ? formatCadence(pkg.releaseCadenceDays) : undefined}
        />
        <Fact label="First released" value={firstReleased ? formatDate(firstReleased) : "—"} />
        <Fact label="Download size" value={pkg.sizeBytes ? formatBytes(pkg.sizeBytes) : "—"} />
        <Fact label="License" value={pkg.license || "Not declared"} />
        <div className="flex flex-col gap-1">
          <dt className="pkg-label">Authors</dt>
          <dd className="break-long-words text-sm font-medium text-gray-900 dark:text-zinc-100">
            {authors.length === 0
              ? "—"
              : authors.map((author, i) => (
                  <span key={author.name}>
                    {author.page ? (
                      <a href={authorPath(author.page.slug)} title={`All packages by ${author.name}`} className="pkg-link">
                        {author.name}
                      </a>
                    ) : (
                      author.name
                    )}
                    {i < authors.length - 1 ? ", " : ""}
                  </span>
                ))}
          </dd>
        </div>
      </dl>

      {/* Compatibility */}
      <section aria-labelledby="compatibility" className="mt-8">
        <h2 id="compatibility" className="pkg-heading">Compatibility</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge label="Windows" active={has(Filters.Windows, pkg)} />
          <Badge label="Mac" active={has(Filters.Mac, pkg)} />
          <Badge label="Rhino 6" active={has(Filters.Rhino6, pkg)} />
          <Badge label="Rhino 7" active={has(Filters.Rhino7, pkg)} />
          <Badge label="Rhino 8" active={has(Filters.Rhino8, pkg)} />
          <Badge label="Rhino 9 (WIP)" active={has(Filters.Rhino9, pkg)} />
          <Badge label="Rhino plugin" active={has(Filters.Rhino, pkg)} />
          <Badge label="Grasshopper plugin" active={has(Filters.Grasshopper, pkg)} />
        </div>
        {keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="sr-only">Keywords: </span>
            {keywords.map((keyword) => (
              <a
                key={keyword}
                href={`/?tag=${encodeURIComponent(keyword)}`}
                title={`Packages tagged ${keyword}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 transition-colors hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700/50 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
              >
                {keyword}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Install */}
      <section aria-labelledby="install" className="mt-8">
        <h2 id="install" className="pkg-heading">How to install {pkg.id}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <li>
            Click <a href={installLink} className="pkg-link">Install in Rhino</a> to open Rhino&apos;s
            Package Manager with {pkg.id} selected, or run <Code>_PackageManager</Code> inside Rhino and
            search for <span className="font-semibold">{pkg.id}</span>.
          </li>
          {commandPlatforms.length > 0 && (
            <li>
              Or install it from a terminal (assumes a default Rhino {rhinoRelease} installation):
              {/* Both commands ship in the HTML; globals.css hides the other OS's
                  one once the layout's script has tagged <html data-os>. */}
              <div className="yak-commands">
                {commandPlatforms.map((platform) => (
                  <div key={platform} data-yak-platform={platform} className="mt-2">
                    <span className="pkg-muted">
                      {platformLabel(platform)} ({platform === "windows" ? "PowerShell" : "Terminal"})
                    </span>
                    <pre className="mt-1 overflow-x-auto rounded-md bg-white px-3 py-2 font-mono text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
                      <code>{yakInstallCommand(platform, rhinoRelease, pkg.id)}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </li>
          )}
          {builds.length > 0 && (
            <li>Or download the .yak file above and drag it onto an open Rhino window.</li>
          )}
        </ol>
        <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">Restart Rhino once the install finishes.</p>
      </section>

      {/* Download trend */}
      {downloadHistory.length >= 2 && (
        <section aria-labelledby="trend" className="mt-8">
          <h2 id="trend" className="pkg-heading">Download trend</h2>
          <TrendChart points={downloadHistory} />
        </section>
      )}

      {/* Version history */}
      <section aria-labelledby="versions" className="mt-8">
        <h2 id="versions" className="pkg-heading">{pkg.id} version history</h2>
        {versionRows.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">No version history available.</p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
              <table className="pkg-table w-full text-left text-sm text-gray-600 dark:text-zinc-400">
                <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-600 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Version</th>
                    <th scope="col">Builds</th>
                    <th scope="col" className="text-right">Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900/40">
                  {versionRows.slice(0, maxVersionRows).map((row) => (
                    <tr key={`${row.version}-${row.createdAt}`}>
                      <td className="whitespace-nowrap">{formatDate(row.createdAt)}</td>
                      <td className="font-mono text-gray-900 dark:text-zinc-100">
                        {row.version}
                        {row.prerelease && (
                          <span className="ml-2 rounded-full bg-brand-50 px-1.5 py-0.5 font-sans text-[0.6rem] font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                            Pre-release
                          </span>
                        )}
                      </td>
                      <td>
                        <ul className="flex flex-col gap-1">
                          {row.distributions.map((distribution) => (
                            <li key={distribution.url}>
                              <a href={distribution.url} download={distribution.filename} className="pkg-link">
                                {formatDistributionTarget(distribution)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {row.downloadCount > 0 ? row.downloadCount.toLocaleString("en-US") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {versionRows.length > maxVersionRows && (
              <p className="pkg-muted mt-2">
                Showing the latest {maxVersionRows} of {versionRows.length} releases.{" "}
                <a href={`/?p=${encodeURIComponent(pkg.id)}`} className="pkg-link">
                  See every release in the directory
                </a>
                .
              </p>
            )}
          </>
        )}
      </section>

      {sameOwners.length > 0 && (
        <section aria-labelledby="same-owner" className="mt-10">
          <h2 id="same-owner" className="pkg-heading">
            More by{" "}
            {publishers.map((author, i) => (
              <span key={author.slug}>
                <a href={authorPath(author.slug)} className="pkg-link">{author.name}</a>
                {i < publishers.length - 1 ? ", " : ""}
              </span>
            ))}
          </h2>
          <PackageLinks packages={sameOwners} />
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-10">
          <h2 id="related" className="pkg-heading">Related packages</h2>
          <PackageLinks packages={related} />
        </section>
      )}

      <p className="mt-10 text-xs text-gray-500 dark:text-zinc-400">
        Package data comes from Rhino&apos;s{" "}
        <a href="https://yak.rhino3d.com" className="pkg-link">Yak package manager</a> and is refreshed every
        few hours. <a href="/packages" className="pkg-link">Browse all packages A–Z</a> or{" "}
        <a href="/authors" className="pkg-link">all authors</a>.
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

function Pill({ tone, children }: { tone: "yellow" | "rose" | "amber"; children: React.ReactNode }) {
  const tones = {
    yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-500/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={active ? "pkg-badge pkg-badge-on" : "pkg-badge"}>
      <span className="sr-only">{active ? `Supported: ${label}` : `Not supported: ${label}`}</span>
      <span aria-hidden="true">{active ? "✓ " : ""}{label}</span>
    </span>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8em] text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </code>
  );
}

function DistributionLinks({ distributions }: { distributions: Distribution[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {distributions.map((distribution) => (
        <li key={distribution.url} className="text-sm">
          <a href={distribution.url} download={distribution.filename} className="pkg-link break-all">
            {distribution.filename}
          </a>
          <span className="pkg-muted ml-2">{formatDistributionTarget(distribution)}</span>
        </li>
      ))}
    </ul>
  );
}

function PackageLinks({ packages }: { packages: Package[] }) {
  return (
    <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {packages.map((other) => (
        <li key={other.id}>
          <a
            href={packagePath(other.id)}
            className="pkg-card"
          >
            <PackageIcon className="h-8 w-8 flex-shrink-0 rounded-sm" src={iconSrc(other.iconUrl)} size={32} />
            <span className="min-w-0">
              <span className="break-long-words block text-sm font-semibold text-gray-900 dark:text-zinc-100">{other.id}</span>
              <span className="pkg-muted block">
                {pluginKind(other)} · {other.downloads.toLocaleString("en-US")} downloads
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Static version of the directory's sparkline: no hover, just the curve. */
function TrendChart({ points }: { points: HistoryPoint[] }) {
  const width = 600;
  const height = 80;
  const values = points.map((p) => p.downloads);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const positions = timePositions(points.map((p) => p.date));
  const coords = values.map((v, i) => ({
    x: positions[i] * width,
    y: height - 4 - ((v - min) / span) * (height - 8),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${line} L${width},${height} L0,${height} Z`} className="fill-brand-500/10 dark:fill-brand-400/10" />
        <path d={line} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" className="stroke-brand-500 dark:stroke-brand-400" />
      </svg>
      <figcaption className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
        {/* Snapshot dates are plain calendar days; formatDate would shift them a day. */}
        {first.downloads.toLocaleString("en-US")} downloads on {first.date} →{" "}
        {last.downloads.toLocaleString("en-US")} on {last.date}
      </figcaption>
    </figure>
  );
}
