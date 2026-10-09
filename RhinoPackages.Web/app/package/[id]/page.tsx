import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";
import CopyButton from "@/app/_components/CopyButton";
import Fact from "@/app/_components/Fact";
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
  compactNumber,
  formatDate,
  formatDay,
  has,
  latestRelease,
} from "@/app/_components/packageModel";
import { Author, findAuthorByName, isIndexedAuthor } from "@/app/_components/authors";
import {
  GroupedVersionHistoryRow,
  StatusTone,
  YakPlatform,
  authorPath,
  displayKeywords,
  formatBytes,
  formatCadence,
  formatDistributionTarget,
  groupVersionHistory,
  hasDescription,
  iconSrc,
  latestDistributions,
  packageDescription,
  packagePath,
  packageTitle,
  parseWebsiteAction,
  platformLabel,
  platformsText,
  pluginKind,
  relatedPackages,
  releaseFacts,
  rhinoVersionsText,
  statusBadges,
  statusToneClasses,
  yakInstallCommand,
  yakRhinoRelease,
} from "@/app/_components/packageInfo";

// The version history table shows this many releases; the rest sit behind a
// "Show all" toggle that is still plain HTML.
const visibleVersionRows = 10;

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

  const now = Date.now();
  const builds = latestDistributions(pkg, versionHistory);
  const versionRows = groupVersionHistory(versionHistory);
  const { websiteHref, emailHref } = parseWebsiteAction(pkg.homepageUrl);
  const keywords = displayKeywords(pkg);
  const installLink = `rhino://package/search?name=${pkg.id}`;

  // Rows are newest first; their newest entry counts towards "inactive" too,
  // since the package's own dates can lag behind a later pre-release.
  const newestRow = versionRows.length > 0 ? new Date(versionRows[0].createdAt).getTime() : NaN;
  const badges = statusBadges(pkg, now, Number.isFinite(newestRow) ? newestRow : undefined);
  const lastRelease = latestRelease(pkg);
  const releases = releaseFacts(pkg, versionRows, now);

  // Credited names that publish more than one package on Yak link to their author page.
  const credits = pkg.authors
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const author = findAuthorByName(name);
      return { name, page: author && isIndexedAuthor(author) ? author : undefined };
    });

  // Everything the publishers have on Yak, the same lists their author pages show.
  const publishers = pkg.owners
    .map((owner) => findAuthorByName(owner.name))
    .filter((author): author is Author => author !== undefined)
    .filter((author, i, list) => list.findIndex((other) => other.slug === author.slug) === i);
  const byPublishers = new Map<string, Package>();
  for (const author of publishers) {
    for (const other of author.packages) {
      if (other.id !== pkg.id) byPublishers.set(other.id, other);
    }
  }
  const moreByAll = Array.from(byPublishers.values()).sort((a, b) => b.downloads - a.downloads);
  const moreBy = moreByAll.slice(0, 8);
  const indexedPublishers = publishers.filter(isIndexedAuthor);
  const seeAll = moreByAll.length > moreBy.length && indexedPublishers.length === 1 ? indexedPublishers[0] : undefined;
  const related = relatedPackages(pkg, all, 8, new Set(moreBy.map((p) => p.id)));

  const commandPlatforms: YakPlatform[] = [
    has(Filters.Windows, pkg) ? ("windows" as const) : null,
    has(Filters.Mac, pkg) ? ("mac" as const) : null,
  ].filter((p): p is YakPlatform => p !== null);
  const rhinoRelease = yakRhinoRelease(pkg);

  const perDay = releases.perDay !== null && releases.perDay >= 0.1 ? releases.perDay : null;
  const releaseHint = [
    releases.cadenceDays !== null ? formatCadence(releases.cadenceDays) : null,
    // With a single release the share is trivially 100%.
    releases.count > 1 && releases.latestShare
      ? `${releases.latestShare.percent}% of downloads on v${releases.latestShare.version}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const worksWith = [rhinoVersionsText(pkg), platformsText(pkg)].filter(Boolean).join(" · ");

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
            <time dateTime={lastRelease.toISOString()}>{formatDate(lastRelease)}</time>
          </p>
          {badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Pill key={badge.label} tone={badge.tone} title={badge.title}>
                  {badge.label}
                </Pill>
              ))}
            </div>
          )}
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

      {/* Keywords */}
      {keywords.length > 0 && (
        <div id="keywords" className="mt-5">
          <h2 className="pkg-label">Keywords</h2>
          <div className="mt-2 flex flex-wrap gap-2">
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
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* rhino:// links only work on the computer that runs Rhino. */}
        <a
          href={installLink}
          title={`Install ${pkg.id} in Rhino`}
          className="hidden items-center gap-1.5 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 dark:focus-visible:ring-white/30 md:inline-flex"
        >
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
          Install in Rhino
        </a>
        <p className="pkg-muted w-full md:hidden">
          Install from the computer that runs Rhino ·{" "}
          <a href="#install" className="pkg-link">How to install</a>
        </p>
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
        {builds.length > 1 && (
          <a href="#files" title={`Choose one of ${builds.length} builds of v${pkg.version}`} className="pkg-button">
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
      </div>

      {/* Facts */}
      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 lg:grid-cols-4">
        <Fact
          label="Total downloads"
          value={pkg.downloads.toLocaleString("en-US")}
          hint={
            perDay !== null
              ? `~${perDay >= 10 ? Math.round(perDay).toLocaleString("en-US") : perDay.toFixed(1)}/day`
              : undefined
          }
        />
        <Fact
          label="This week"
          value={`+${(pkg.downloadsWeek ?? 0).toLocaleString("en-US")}`}
          hint={`+${(pkg.downloadsMonth ?? 0).toLocaleString("en-US")} this month`}
        />
        <Fact
          label="Releases"
          value={releases.count > 0 ? releases.count.toLocaleString("en-US") : "—"}
          hint={releaseHint || undefined}
        />
        <Fact label="First released" value={releases.firstReleased ? formatDate(releases.firstReleased) : "—"} />
        <Fact label="Works with" value={worksWith || "—"} />
        <Fact label="Download size" value={pkg.sizeBytes ? formatBytes(pkg.sizeBytes) : "—"} />
        <Fact
          label="License"
          value={pkg.license || <span className="font-normal text-gray-500 dark:text-zinc-400">Not declared</span>}
        />
        <Fact
          label="Credits"
          value={
            credits.length === 0
              ? "—"
              : credits.map((credit, i) => (
                  <span key={credit.name}>
                    {credit.page ? (
                      <a href={authorPath(credit.page.slug)} title={`All packages by ${credit.name}`} className="pkg-link">
                        {credit.name}
                      </a>
                    ) : (
                      credit.name
                    )}
                    {i < credits.length - 1 ? ", " : ""}
                  </span>
                ))
          }
        />
      </dl>

      {/* Install */}
      <section aria-labelledby="install" className="mt-8">
        <h2 id="install" className="pkg-heading">How to install {pkg.id}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          <li>
            <span className="hidden md:inline">
              Click <a href={installLink} className="pkg-link">Install in Rhino</a> to open Rhino&apos;s
              Package Manager with {pkg.id} selected, or run <Code>_PackageManager</Code> inside Rhino and
              search for <span className="font-semibold">{pkg.id}</span>.
            </span>
            <span className="md:hidden">
              On the computer running Rhino, run <Code>_PackageManager</Code> and search for{" "}
              <span className="font-semibold">{pkg.id}</span>.
            </span>{" "}
            <CopyButton text={pkg.id} label="Copy name" ariaLabel={`Copy the package name ${pkg.id}`} />
          </li>
          {commandPlatforms.length > 0 && (
            <li>
              Or install it from a terminal (assumes a default Rhino {rhinoRelease} installation):
              {/* Both commands ship in the HTML; globals.css hides the other OS's
                  one once the layout's script has tagged <html data-os>. */}
              <div className="yak-commands">
                {commandPlatforms.map((platform) => {
                  const command = yakInstallCommand(platform, rhinoRelease, pkg.id);
                  return (
                    <div key={platform} data-yak-platform={platform} className="mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="pkg-muted">
                          {platformLabel(platform)} ({platform === "windows" ? "PowerShell" : "Terminal"})
                        </span>
                        <CopyButton
                          text={command}
                          label="Copy"
                          ariaLabel={`Copy the ${platformLabel(platform)} install command`}
                        />
                      </div>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-white px-3 py-2 font-mono text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
                        <code>{command}</code>
                      </pre>
                    </div>
                  );
                })}
              </div>
            </li>
          )}
          {builds.length > 0 && (
            <li>
              Or download a .yak file and drag it onto an open Rhino window.
              <DistributionLinks id="files" distributions={builds} />
            </li>
          )}
        </ol>
        <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">Restart Rhino once the install finishes.</p>
      </section>

      {moreBy.length > 0 && (
        <section aria-labelledby="same-owner" className="mt-10">
          <h2 id="same-owner" className="pkg-heading">
            More by{" "}
            {publishers.map((author, i) => (
              <span key={author.slug}>
                {isIndexedAuthor(author) ? (
                  <a href={authorPath(author.slug)} className="pkg-link">{author.name}</a>
                ) : (
                  author.name
                )}
                {i < publishers.length - 1 ? ", " : ""}
              </span>
            ))}
          </h2>
          <PackageLinks packages={moreBy} />
          {seeAll && (
            <p className="mt-3 text-sm">
              <a href={authorPath(seeAll.slug)} className="pkg-link">
                See all {seeAll.packages.length} by {seeAll.name} →
              </a>
            </p>
          )}
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-10">
          <h2 id="related" className="pkg-heading">Related packages</h2>
          <PackageLinks packages={related} />
        </section>
      )}

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
            <VersionTable packageId={pkg.id} rows={versionRows.slice(0, visibleVersionRows)} />
            {versionRows.length > visibleVersionRows && (
              <details className="mt-3">
                <summary className="pkg-link cursor-pointer text-sm">Show all {releases.count} releases</summary>
                <VersionTable packageId={pkg.id} rows={versionRows.slice(visibleVersionRows)} />
              </details>
            )}
          </>
        )}
      </section>
    </article>
  );
}

function Pill({ tone, title, children }: { tone: StatusTone; title: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusToneClasses[tone]}`}
    >
      {children}
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

function DistributionLinks({ id, distributions }: { id?: string; distributions: Distribution[] }) {
  return (
    <ul id={id} className="mt-2 flex flex-col gap-1.5">
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

/**
 * One table of release rows. The "Show all" toggle renders a second one, so
 * from md up the columns have fixed widths to keep the two lined up; on a
 * phone both use the auto layout so the table stays close to the screen
 * width. The Install column needs Rhino on the same computer, so it stays
 * off phones. The Builds column is left off too, below sm: with it the table
 * is wider than a phone and scrolls sideways inside its box, hiding the
 * downloads. The current release's builds are listed under "How to install".
 */
function VersionTable({ packageId, rows }: { packageId: string; rows: GroupedVersionHistoryRow[] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
      <table className="pkg-table w-full text-left text-sm text-gray-600 md:min-w-[38rem] md:table-fixed dark:text-zinc-400">
        <colgroup>
          <col className="md:w-28" />
          <col />
          <col className="hidden sm:table-column" />
          <col className="md:w-28" />
          <col className="hidden md:table-column md:w-24" />
        </colgroup>
        <thead className="bg-gray-100 text-xs font-medium uppercase text-gray-600 dark:bg-zinc-800/50 dark:text-zinc-400">
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Version</th>
            <th scope="col" className="hidden sm:table-cell">Builds</th>
            <th scope="col" className="text-right">Downloads</th>
            <th scope="col" className="hidden md:table-cell">Install</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900/40">
          {rows.map((row) => (
            <tr key={`${row.version}-${row.createdAt}`}>
              <td className="whitespace-nowrap">{formatDate(row.createdAt)}</td>
              <td className="break-long-words font-mono text-gray-900 dark:text-zinc-100">
                {row.version}
                {row.prerelease && (
                  <span className={`mt-1 block w-fit rounded-full px-1.5 py-0.5 font-sans text-[0.6rem] font-medium ring-1 ring-inset sm:ml-2 sm:mt-0 sm:inline ${statusToneClasses.yellow}`}>
                    Pre-release
                  </span>
                )}
              </td>
              <td className="hidden sm:table-cell">
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
              <td className="hidden whitespace-nowrap md:table-cell">
                {row.installVersion ? (
                  <a
                    href={`rhino://package/search?name=${packageId}&version=${row.installVersion}`}
                    aria-label={`Install ${packageId} version ${row.installVersion}`}
                    className="pkg-link"
                  >
                    Install
                  </a>
                ) : (
                  // A row that merges several versions has no single version to
                  // install; a link without &version would install the latest.
                  <span title="Several builds; install from Rhino's Package Manager">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">Several builds; install from Rhino&apos;s Package Manager</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
                {pluginKind(other)} · {compactNumber(other.downloads)} {other.downloads === 1 ? "download" : "downloads"}
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
        {first.downloads.toLocaleString("en-US")} downloads on {formatDay(first.date)} →{" "}
        {last.downloads.toLocaleString("en-US")} on {formatDay(last.date)}
      </figcaption>
    </figure>
  );
}
