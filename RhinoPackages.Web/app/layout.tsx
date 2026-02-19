import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Spinner from "./_components/Spinner";
import { ThemeProvider } from "./_components/ThemeProvider";
import { ThemeToggle } from "./_components/ThemeToggle";

import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rhino Packages",
  description:
    "This website gives you a bit more info about Rhino 3D packages than what is currently available using the _PackageManager command.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <Telemetry />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 selection:bg-pink-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="mx-auto max-w-6xl px-4 pb-10 pt-2">
            <div className="flex flex-grow items-center justify-between border-b border-gray-200 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="RhinoPackages Logo"
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
              </div>
              <ThemeToggle />
            </div>
            <Suspense
              fallback={
                <div className="mt-10 flex justify-center">
                  <Spinner />
                </div>
              }
            >
              {children}
            </Suspense>
            <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-500 dark:border-zinc-800 dark:text-zinc-400">
              Site Generated: {new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

function Telemetry() {
  return (
    <>
      <Script
        id="analytics01"
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-2K0DM9L0LH"
      />
      <Script id="analytics02">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2K0DM9L0LH');
          `}
      </Script>
    </>
  );
}
