import type { Metadata } from "next";
import StatsPageClient from "../_components/StatsPageClient";

export const metadata: Metadata = {
  title: "Directory Stats",
  description:
    "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
  alternates: {
    canonical: "/stats",
  },
  openGraph: {
    title: "Directory Stats | Rhino Packages",
    description:
      "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
    url: "https://rhinopackages.github.io/stats",
  },
  twitter: {
    title: "Directory Stats | Rhino Packages",
    description:
      "Live summary statistics for RhinoPackages: package counts, plugin types, and latest updates from the Rhino ecosystem.",
  },
};

export default function Page() {
  return <StatsPageClient />;
}
