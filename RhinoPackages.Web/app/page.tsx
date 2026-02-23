import type { Metadata } from "next";
import HomePageClient from "./_components/HomePageClient";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://rhinopackages.github.io/",
  },
};

export default function Page() {
  return <HomePageClient />;
}
