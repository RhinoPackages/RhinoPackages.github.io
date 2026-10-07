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
  title: {
    default: "Rhino Packages — Browse & Install Plugins",
    template: "%s | Rhino Packages",
  },
  description:
    "Browse, search, and install over 1,000 Rhino 3D and Grasshopper plugins. The most comprehensive Rhino plugin directory — filter by platform, Rhino version, and type. Updated daily from the Yak package manager.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased overflow-x-hidden" suppressHydrationWarning>
      <head>
        <Telemetry />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 selection:bg-pink-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-300"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-brand-600 focus:font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus:bg-zinc-900 dark:focus:text-brand-400"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="mx-auto max-w-6xl px-4 pb-10 pt-2">
            <div className="flex flex-grow items-center justify-between gap-2 border-b border-gray-200 pb-3 dark:border-zinc-800">
              <a href="/" title="Rhino Packages - Go to homepage" aria-label="Rhino Packages - Go to homepage" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 xs:gap-3">
                <Image
                  src="/logo.svg"
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={36}
                  className="h-8 w-8 flex-shrink-0 rounded-md shadow-sm xs:h-9 xs:w-9"
                />
                {/* Truncates rather than overflowing into the links on the
                    right, which used to collide on narrow phones. */}
                <h1 className="truncate pt-1 text-lg tracking-wider xs:text-xl">
                  <span className="font-bold text-gray-900 dark:text-white">
                    Rhino
                  </span>{" "}
                  <span className="font-light text-gray-500 dark:text-zinc-400">Packages</span>
                </h1>
              </a>
              <div className="flex flex-shrink-0 items-center gap-1 xs:gap-2">
                <a
                  href="/#faq"
                  title="Frequently asked questions"
                  aria-label="Frequently asked questions"
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-brand-400 xs:px-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                  <span className="hidden xs:inline">FAQ</span>
                </a>
                <a
                  href="/stats"
                  title="Directory statistics"
                  aria-label="Directory statistics"
                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-brand-400 xs:px-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                  <span className="hidden xs:inline">Stats</span>
                </a>
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
              <nav aria-label="Site" className="mb-3 flex justify-center gap-4">
                <a href="/packages" className="rounded-sm font-medium text-gray-600 hover:text-brand-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-300 dark:hover:text-brand-400 dark:focus-visible:ring-brand-400">
                  All packages A–Z
                </a>
                <a href="/authors" className="rounded-sm font-medium text-gray-600 hover:text-brand-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-300 dark:hover:text-brand-400 dark:focus-visible:ring-brand-400">
                  Authors
                </a>
                <a href="/stats" className="rounded-sm font-medium text-gray-600 hover:text-brand-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-zinc-300 dark:hover:text-brand-400 dark:focus-visible:ring-brand-400">
                  Directory stats
                </a>
              </nav>
              <p>Site Generated: {formatDateTime(new Date())}</p>
              {process.env.NEXT_PUBLIC_VERSION && (
                <p className="mt-1 text-xs">{process.env.NEXT_PUBLIC_VERSION}</p>
              )}
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
