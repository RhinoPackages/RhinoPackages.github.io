# Live download counts worker

The site is static and rebuilt a few times a day, so its download numbers lag
the Yak API by hours. This Cloudflare Worker serves the current lifetime
download count of every package, and the site overlays those numbers on its
build-time data when a page loads. The daily history (`public/data/history`)
is still recorded by the generator; the live count only extends it with
"today".

The Yak API sends no CORS headers, which is why the browser cannot call it
directly and this proxy exists.

## Deploy

```sh
cd worker
npx wrangler login     # once
npx wrangler deploy
```

Wrangler prints the worker's URL, e.g. `https://rhinopackages-live.<account>.workers.dev`.
Check it:

```sh
curl -s -H "Origin: https://rhinopackages.github.io" -D - https://rhinopackages-live.<account>.workers.dev/downloads | head -20
```

Then add it to the repository as an Actions **variable** (not a secret)
named `LIVE_DOWNLOADS_URL`, set to the worker URL (with or without `/downloads`). The deploy
workflow passes it to the site build as `NEXT_PUBLIC_LIVE_DOWNLOADS_URL`.
Without it the site simply shows its build-time numbers.

## Endpoint

`GET /downloads` returns

```json
{ "updatedAt": "2026-11-13T05:00:00.000Z", "downloads": { "Eddy3D": 12421, "...": 0 } }
```

cached for 60 seconds. Allowed browser origins are set in `wrangler.toml`
(`ALLOWED_ORIGINS`).
