import { useEffect, useState } from "react";
import { Package, Status } from "./packageModel";

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

  return { cache, status };
}
