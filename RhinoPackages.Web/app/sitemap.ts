import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Only the two real documents are listed. This used to advertise a
// "/?p=<id>" URL per package, but every one of them serves index.html, whose
// canonical is "/" — so Google discarded all 1,156 as duplicates and the
// sitemap was telling it the site is mostly boilerplate. Deep links still work
// and stay crawlable through the on-page links; they earn sitemap entries once
// each package has a document of its own to point at.
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://rhinopackages.github.io";
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/stats`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
