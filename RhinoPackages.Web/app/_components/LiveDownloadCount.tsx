"use client";

import { compactNumber } from "./packageModel";
import { useLiveDownloads } from "./liveDownloads";

/**
 * A package's download count on a server-rendered page: the build-time number
 * in the exported HTML, swapped for the live one once it arrives.
 */
export default function LiveDownloadCount({
  id,
  fallback,
  format = "full",
  suffix = false,
}: {
  id: string;
  fallback: number;
  format?: "full" | "compact";
  /** Append " download"/" downloads". */
  suffix?: boolean;
}) {
  const live = useLiveDownloads();
  const current = Math.max(live?.get(id) ?? fallback, fallback);
  const text = format === "compact" ? compactNumber(current) : current.toLocaleString("en-US");
  return (
    <>
      {text}
      {suffix && (current === 1 ? " download" : " downloads")}
    </>
  );
}

/**
 * A figure that grows with the downloads since the build, such as "this
 * week": `base` plus (live total − build-time total).
 */
export function LiveDownloadDelta({ id, total, base, prefix = "" }: { id: string; total: number; base: number; prefix?: string }) {
  const live = useLiveDownloads();
  const gained = Math.max(0, (live?.get(id) ?? total) - total);
  return (
    <>
      {prefix}
      {(base + gained).toLocaleString("en-US")}
    </>
  );
}
