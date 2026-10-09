"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { defaultIconUrl, iconSrc } from "./packageInfo";

export default function PackageIcon({
  src,
  alt = "",
  size,
  className,
  title,
}: {
  src?: string | null;
  alt?: string;
  size: number;
  className?: string;
  title?: string;
}) {
  // Keyed by the URL that failed rather than a plain flag, so a card reused
  // for another package retries instead of inheriting the broken state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);
  // Yak data now and then holds an icon that is not a URL ("logo.png"), which
  // would resolve against whichever page shows it. Every caller gets the same
  // safe address, so none has to remember to clean it.
  const safeSrc = iconSrc(src);
  const isBroken = failedSrc === safeSrc;
  // Plenty of Yak icons are a black logo on a transparent background, which
  // vanishes on the dark theme. A light backing keeps them visible there; on
  // the light theme it would be white on white, so it is dark only. Callers
  // that round the icon themselves keep their own radius.
  const backing = className?.includes("rounded") ? "dark:bg-white/80" : "rounded-md dark:bg-white/80";

  useEffect(() => {
    // The pages are statically exported, so an icon can finish failing before
    // React attaches onError. Ask the browser what it actually got instead.
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailedSrc(safeSrc);
  }, [safeSrc]);

  return (
    <Image
      ref={ref}
      className={className ? `${backing} ${className}` : backing}
      src={isBroken ? defaultIconUrl : safeSrc}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      title={title}
      onError={() => setFailedSrc(safeSrc)}
    />
  );
}
