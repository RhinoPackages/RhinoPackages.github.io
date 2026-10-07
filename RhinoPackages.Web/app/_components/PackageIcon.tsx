"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { defaultIconUrl } from "./packageInfo";

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
  const isBroken = !src || failedSrc === src;

  useEffect(() => {
    // The pages are statically exported, so an icon can finish failing before
    // React attaches onError. Ask the browser what it actually got instead.
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailedSrc(src ?? null);
  }, [src]);

  return (
    <Image
      ref={ref}
      className={className}
      src={isBroken ? defaultIconUrl : src}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      title={title}
      onError={() => setFailedSrc(src ?? null)}
    />
  );
}
