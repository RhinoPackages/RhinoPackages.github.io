import type { MetadataRoute } from "next";
import { loadPackages } from "./_components/packageData";
import { packagePath } from "./_components/packageInfo";

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
  ];
}
