import type { MetadataRoute } from "next";
import { loadPackages } from "./_components/packageData";
import { packagePath } from "./_components/packageInfo";
import { authorPath, isIndexedAuthor, loadAuthors } from "./_components/authors";

export const dynamic = "force-static";

// Every package has a static page of its own (/package/<id>), so each one is
// listed with the date of its latest release. The old "/?p=<id>" deep links
// stay out: they all serve index.html with a canonical of "/", and Google
// discarded all of them as duplicates when they were listed here.
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://rhinopackages.github.io";
  const lastModified = new Date();
  const packages = loadPackages();

  const latestRelease = (updated: string, lastReleased?: string | null) =>
    new Date(Math.max(new Date(updated).getTime(), lastReleased ? new Date(lastReleased).getTime() : 0));

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/packages`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/authors`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/stats`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...packages.map((pkg) => ({
      url: `${siteUrl}${packagePath(pkg.id)}`,
      lastModified: latestRelease(pkg.updated, pkg.lastReleased),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Single-package authors are noindex (their page repeats the package page), so only list the rest.
    ...loadAuthors()
      .filter(isIndexedAuthor)
      .map((author) => ({
        url: `${siteUrl}${authorPath(author.slug)}`,
        lastModified: new Date(
          Math.max(...author.packages.map((pkg) => latestRelease(pkg.updated, pkg.lastReleased).getTime())),
        ),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
