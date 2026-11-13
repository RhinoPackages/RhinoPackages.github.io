/**
 * Live download counts for every Yak package, for rhinopackages.github.io.
 *
 * The Yak API sends no CORS headers, so a browser on the site cannot read it
 * directly. This worker makes one request to https://yak.rhino3d.com/packages
 * (every package and its lifetime download_count), reduces it to
 * { "<name>": <count> } and serves that with CORS headers.
 *
 * Responses are cached for CACHE_SECONDS, both inside the worker and by the
 * browser, so the Yak API sees at most about one request a minute from here
 * however many people visit the site.
 *
 *   GET /downloads -> { "updatedAt": "<ISO time>", "downloads": { "Eddy3D": 12421, ... } }
 */

const UPSTREAM = "https://yak.rhino3d.com/packages";
const CACHE_SECONDS = 60;

// Per-isolate cache. Cloudflare's Cache API does nothing on workers.dev, so a
// module-level value is what keeps repeat visits off the upstream API.
let cached = null; // { body: string, expires: number }
let inflight = null; // Promise<string> while a refresh is running

async function refresh() {
  const response = await fetch(UPSTREAM, {
    headers: { Accept: "application/json", "User-Agent": "rhinopackages-live-worker" },
  });
  if (!response.ok) throw new Error(`Yak API responded ${response.status}`);

  const entries = await response.json();
  const downloads = {};
  for (const entry of entries) {
    if (typeof entry?.name === "string" && Number.isFinite(entry.download_count)) {
      downloads[entry.name] = entry.download_count;
    }
  }

  const body = JSON.stringify({ updatedAt: new Date().toISOString(), downloads });
  cached = { body, expires: Date.now() + CACHE_SECONDS * 1000 };
  return body;
}

async function counts() {
  if (cached && cached.expires > Date.now()) return cached.body;
  // Collapse concurrent misses into one upstream request.
  inflight ??= refresh().finally(() => (inflight = null));
  try {
    return await inflight;
  } catch (error) {
    // Serve stale data rather than nothing when Yak has a hiccup.
    if (cached) return cached.body;
    throw error;
  }
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim());
  const headers = { Vary: "Origin" };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: cors });
    if (pathname !== "/downloads") return new Response("Not found", { status: 404, headers: cors });

    try {
      return new Response(await counts(), {
        headers: {
          ...cors,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
  },
};
