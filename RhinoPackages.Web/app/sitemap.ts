import fs from "fs";
import path from "path";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

interface PackageEntry {
  id: string;
  updated: string;
  downloads: number;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://rhinopackages.github.io";
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
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

  try {
    const dataPath = path.join(process.cwd(), "public", "data.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const packages = JSON.parse(raw) as PackageEntry[];

    for (const pkg of packages) {
      entries.push({
        url: `${siteUrl}/?p=${encodeURIComponent(pkg.id)}`,
        lastModified: new Date(pkg.updated),
        changeFrequency: "weekly",
        priority: pkg.downloads > 10000 ? 0.7 : pkg.downloads > 1000 ? 0.6 : 0.5,
      });
    }
  } catch {
    // data.json not available at build time — return base entries only
  }

  return entries;
}
