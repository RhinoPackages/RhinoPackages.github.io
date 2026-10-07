// Metadata shared by every page. A page that sets `openGraph` replaces the
// layout's block wholesale (Next.js merges metadata one key deep), so pages
// spread these defaults instead of repeating them.

export const siteUrl = "https://rhinopackages.github.io";

export const openGraphDefaults = {
  type: "website" as const,
  locale: "en_US",
  siteName: "Rhino Packages",
  images: [
    {
      url: "/logo.png",
      width: 512,
      height: 512,
      alt: "Rhino Packages — Rhino 3D and Grasshopper Plugin Directory",
    },
  ],
};

export const twitterDefaults = {
  card: "summary" as const,
  images: ["/logo.png"],
};
