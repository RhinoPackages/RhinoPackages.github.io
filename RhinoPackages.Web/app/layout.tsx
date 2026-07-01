import { Suspense } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Spinner from "./_components/Spinner";
import { ThemeProvider } from "./_components/ThemeProvider";
import { ThemeToggle } from "./_components/ThemeToggle";
import ContributorsBubbles from "./_components/ContributorsBubbles";
import ScrollToTop from "./_components/ScrollToTop";

import Image from "next/image";

const siteUrl = "https://rhinopackages.github.io";

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
    {
      "@type": "CollectionPage",
      "@id": `${siteUrl}/#collection`,
      name: "Rhino 3D and Grasshopper Plugin Directory",
      description: "Complete catalog of Rhino 3D plugins and Grasshopper add-ons available through the Yak package manager, with version history, platform compatibility, and direct install links.",
      url: `${siteUrl}/`,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: {
        "@type": "SoftwareApplication",
        name: "Rhinoceros 3D",
        applicationCategory: "DesignApplication",
        operatingSystem: "Windows, macOS",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Rhino Packages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rhino Packages is the most comprehensive directory of Rhino 3D and Grasshopper plugins. It indexes over 1,000 packages from the Yak package manager with search, filtering, version history, and one-click install links.",
          },
        },
        {
          "@type": "Question",
          name: "How do I install a Rhino plugin from this directory?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Click the 'Install' button on any package card. This opens a rhino:// protocol link that launches Rhino's built-in Package Manager and installs the plugin directly. You can also use the _PackageManager command inside Rhino.",
          },
        },
        {
          "@type": "Question",
          name: "What is the difference between a Rhino plugin and a Grasshopper plugin?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rhino plugins (.rhp) add commands and features directly to Rhinoceros 3D. Grasshopper plugins (.gha) add components to Grasshopper, Rhino's visual programming environment for parametric and computational design. Many packages include both.",
          },
        },
        {
          "@type": "Question",
          name: "Which Rhino versions are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Packages in this directory support Rhino 6, Rhino 7, and Rhino 8. You can filter by version to find plugins compatible with your installation. Most actively maintained plugins support Rhino 7 and 8.",
          },
        },
        {
          "@type": "Question",
          name: "Are these plugins available for Mac?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Many plugins support both Windows and macOS. Use the platform filter to find Mac-compatible packages. Platform support depends on the individual plugin author.",
          },
        },
        {
          "@type": "Question",
          name: "How often is the plugin directory updated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The directory is updated daily via automated GitHub Actions that sync with the official Yak package manager feed. New plugins and version updates appear within 24 hours of publication.",
          },
        },
      ],
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
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Rhino Packages",
    title: "Rhino Packages — Browse & Install 1,000+ Rhino 3D & Grasshopper Plugins",
    description:
      "The most comprehensive directory of Rhino 3D and Grasshopper plugins. Browse over 1,000 packages, filter by platform and version, install with one click.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Rhino Packages — Rhino 3D and Grasshopper Plugin Directory",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Rhino Packages — 1,000+ Rhino 3D & Grasshopper Plugins",
    description:
      "The most comprehensive directory of Rhino 3D and Grasshopper plugins. Search, filter, and install from the Yak package manager.",
    images: ["/logo.png"],
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
            <div className="flex flex-grow items-center justify-between border-b border-gray-200 pb-3 dark:border-zinc-800">
              <a href="/" title="Rhino Packages - Go to homepage" aria-label="Rhino Packages - Go to homepage" className="flex items-center gap-3 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400">
                <Image
                  src="/logo.svg"
                  alt=""
                  aria-hidden="true"
                  width={36}
                  height={36}
                  className="rounded-md shadow-sm"
                />
                <h1 className="flex items-center gap-1 text-xl tracking-wider pt-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    Rhino
                  </span>
                  <span className="font-light text-gray-500 dark:text-zinc-400">Packages</span>
                </h1>
              </a>
              <ThemeToggle />
            </div>
            <div id="main-content" tabIndex={-1} className="outline-none">
              <Suspense
                fallback={
                  <div className="mt-10 flex justify-center">
                    <Spinner />
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
            <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
              <p>Site Generated: {new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</p>
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
