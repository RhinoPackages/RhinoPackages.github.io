import { useEffect, useMemo, useState } from "react";
import { Package, Status } from "./packageModel";
import { useLiveDownloads, withLiveCounts } from "./liveDownloads";

export * from "./packageModel";

export function useApi(initialCache: Package[] = []) {
  const [cache, setCache] = useState<Package[]>(initialCache);
  // Nothing preloaded means the very first render is "loading", never an error state.
  const [status, setStatus] = useState<Status>(initialCache.length ? Status.idle() : Status.loading());

  useEffect(() => {
    if (initialCache.length > 0) {
      return;
    }

    (async () => {
      setStatus(Status.loading());
      try {
        const url = `/data.json`;
        const response = await fetch(url);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || response.statusText);
        }
        const data = (await response.json()) as Package[];
        setCache(data);
        setStatus(Status.idle());
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(new Status(message));
      }
    })();
  }, [initialCache.length]);

  // Lay the live counts over the build-time data once they arrive, so every
  // number, sort and stat on the page uses them.
  const live = useLiveDownloads();
  const packages = useMemo(() => withLiveCounts(cache, live), [cache, live]);

  return { cache: packages, status };
}
