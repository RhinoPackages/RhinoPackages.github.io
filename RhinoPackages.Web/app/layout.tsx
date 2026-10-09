import { Suspense } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Spinner from "./_components/Spinner";
import { ThemeProvider } from "./_components/ThemeProvider";
import { ThemeToggle } from "./_components/ThemeToggle";
import ContributorsBubbles from "./_components/ContributorsBubbles";
import ScrollToTop from "./_components/ScrollToTop";
import { formatDateTime } from "./_components/format";
import { openGraphDefaults, siteUrl, twitterDefaults } from "./_components/seo";

import Image from "next/image";
import {
  ChartBarIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";


const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Rhino Packages",
      alternateName: ["RhinoPackages", "Rhino Plugin Directory", "Grasshopper Plugin Directory"],
      url: `${siteUrl}/`,
      description:
        "The most comprehensive directory of Rhino 3D and Grasshopper plugins. Browse, search, and install over 1,000 packages from the Yak package manager. Filter by platform, Rhino version, and plugin type.",
      inLanguage: "en-US",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "RhinoPackages",
      url: `${siteUrl}/`,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
      sameAs: ["https://github.com/RhinoPackages/RhinoPackages.github.io"],
    },
  ],
};

export const metadata: Metadata = {
  // Google Search Console ownership check for https://rhinopackages.github.io/.
  verification: {
    google: "SGgQJKmjAZArbrLIt4_tpjWv63D8GH6S269754PDQF4",
  },
  title: {
    default: "Rhino Packages — Browse & Install Plugins",
    template: "%s | Rhino Packages",
  },
  description:
    "Browse, search, and install over 1,000 Rhino 3D and Grasshopper plugins. The most comprehensive Rhino plugin directory — filter by platform, Rhino version, and type. Data is checked every 3 hours against the Yak package manager.",
  keywords: [
    "Rhino 3D plugins",
    "Grasshopper plugins",
    "Rhino packages",
    "Grasshopper add-ons",
    "Yak package manager",
    "Rhino 9 plugins",
    "Rhino 8 plugins",
    "Rhino 7 plugins",
    "Rhino plugin download",
    "Grasshopper components",
    "Rhino extensions",
    "computational design tools",
    "parametric design plugins",
    "3D modeling plugins",
    "AEC software plugins",
    "Rhino architecture plugins",
    "Grasshopper scripts",
    "Rhino plugin directory",
    "Rhino add-ons",
    "Rhinoceros 3D plugins",
    "Rhino package manager",
    "install Rhino plugin",
    "best Rhino plugins",
    "free Rhino plugins",
    "Grasshopper definition",
    "Rhino 3D tools",
  ],
  authors: [{ name: "RhinoPackages" }],
  creator: "RhinoPackages",
  applicationName: "Rhino Packages",
  metadataBase: new URL(siteUrl),
  openGraph: {
    ...openGraphDefaults,
    url: siteUrl,
    title: "Rhino Packages — Browse & Install 1,000+ Rhino 3D & Grasshopper Plugins",
    description:
      "The most comprehensive directory of Rhino 3D and Grasshopper plugins. Browse over 1,000 packages, filter by platform and version, install with one click.",
  },
  twitter: {
    ...twitterDefaults,
    title: "Rhino Packages — 1,000+ Rhino 3D & Grasshopper Plugins",
    description:
      "The most comprehensive directory of Rhino 3D and Grasshopper plugins. Search, filter, and install from the Yak package manager.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Header navigation. Icons only on phones; labels from the sm breakpoint up.
const navLinks = [
  { href: "/packages", label: "Packages", title: "All packages A–Z", Icon: Squares2X2Icon },
  { href: "/authors", label: "Authors", title: "All authors A–Z", Icon: UserGroupIcon },
  { href: "/stats", label: "Stats", title: "Directory statistics", Icon: ChartBarIcon },
  { href: "/faq", label: "FAQ", title: "Frequently asked questions", Icon: QuestionMarkCircleIcon },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased overflow-x-clip" suppressHydrationWarning>
      <head>
        <Telemetry />
        {/* Tags <html> with the visitor's OS before first paint, so pages can
            show only the matching terminal command without a layout shift. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var n=navigator,h=((n.userAgentData&&n.userAgentData.platform)||'')+' '+(n.platform||'')+' '+(n.userAgent||'');h=h.toLowerCase();document.documentElement.dataset.os=h.indexOf('win')>-1?'windows':h.indexOf('mac')>-1||h.indexOf('darwin')>-1?'mac':'other';})();",
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className="min-h-screen overflow-x-clip bg-slate-50 text-slate-900 selection:bg-pink-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-300"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-brand-600 focus:font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus:bg-zinc-900 dark:focus:text-brand-400"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="mx-auto max-w-6xl px-4 pb-10 pt-2">
            <div className="flex flex-grow flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-gray-200 pb-3 dark:border-zinc-800">
              <a href="/" title="Rhino Packages - Go to homepage" aria-label="Rhino Packages - Go to homepage" className="flex items-center gap-2 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 xs:gap-3">
                <Image
                  src="/logo.svg"
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={36}
                  className="h-8 w-8 flex-shrink-0 rounded-md shadow-sm xs:h-9 xs:w-9"
                />
                {/* Never truncated: if the title and links don't fit on one
                    row (very narrow phones), the links wrap below instead. */}
                <span className="whitespace-nowrap pt-1 text-base tracking-wider xs:text-xl">
                  <span className="font-bold text-gray-900 dark:text-white">
                    Rhino
                  </span>{" "}
                  <span className="font-light text-gray-500 dark:text-zinc-400">Packages</span>
                </span>
              </a>
              <div className="flex min-w-0 flex-wrap items-center gap-0.5 sm:gap-2">
                {navLinks.map(({ href, label, title, Icon }) => (
                  <a
                    key={href}
                    href={href}
                    title={title}
                    aria-label={title}
                    className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-brand-400 sm:px-3"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{label}</span>
                  </a>
                ))}
                <ThemeToggle />
              </div>
            </div>
            {/* No Suspense boundary here: useSearchParams() bails out to the
                nearest one, and a boundary around the whole page meant every
                statically rendered part of it — the directory intro, the top
                package list, the FAQ — was replaced by the fallback spinner in
                the exported HTML. Each page wraps its own client subtree. */}
            <div id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </div>
            <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
              <p>Site Generated: {formatDateTime(new Date())}</p>
              {process.env.NEXT_PUBLIC_VERSION && (
                <p className="mt-1 text-xs">{process.env.NEXT_PUBLIC_VERSION}</p>
              )}
              <p className="mt-1">
                <a
                  href="https://rhinoversions.github.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm underline decoration-gray-300 underline-offset-2 transition-colors hover:text-gray-900 hover:decoration-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:decoration-zinc-600 dark:hover:text-zinc-100 dark:hover:decoration-zinc-400 dark:focus-visible:ring-brand-400"
                >
                  Rhino Version Archive
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </p>
              <ContributorsBubbles />
            </footer>
          </main>
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}

function Telemetry() {
  return (
    <>
      <Script id="analytics-lazy-loader" strategy="afterInteractive">
        {`
            (function () {
              if (window.__rpAnalyticsLoaded) return;
              function loadAnalytics() {
                if (window.__rpAnalyticsLoaded) return;
                window.__rpAnalyticsLoaded = true;

                var script = document.createElement('script');
                script.async = true;
                script.src = 'https://www.googletagmanager.com/gtag/js?id=G-2K0DM9L0LH';
                document.head.appendChild(script);

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', 'G-2K0DM9L0LH');
              }

              ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (eventName) {
                window.addEventListener(eventName, loadAnalytics, { once: true, passive: true });
              });
              setTimeout(loadAnalytics, 8000);
            })();
          `}
      </Script>
    </>
  );
}
