Dr. Unslopovich's treatment
Verdict: A careful package page that made you scroll past sixteen other plugins to see this one's release history.
Stack: Next.js 14 static export, React 18, Tailwind 3. Web, responsive, light and dark.
Reviewed: /package/Eddy3D and /author/patrick-kastner from a production `next build` export, at 375 dark and 1280 light. Top tasks: judge a package, install it.
Case: light. Findings fixed in place; palette, type, layout kept.
Score: 21/24 Discharged  Task path 4 · Truth 3 · Native fit 4 · States 3 · Access 3 · Specificity 4
Performance: Not profiled.

Changed (app/package/[id]/page.tsx)
- "More by" and "Related packages" (up to 16 cards, ~1,100px on a phone) moved below Download trend and Version history. Version history now starts ~1,080px higher at 375.
- Version table header no longer uppercase, matching the stats treatment.
- .yak download links under "How to install": 17px -> 28px tall (inline-block py-1, gap-0.5).

Ask first
- app/_components/format.ts:6 formatDate gives "7/4/2026", which a non-US reader takes as 7 April. Used on 12+ surfaces plus formatMonth. -> `{ month: "short", day: "numeric", year: "numeric" }` ("Jul 4, 2026"), which the trend chart axis already uses. Changes every date on the site.

Waived (no chart yet)
- Package-page Install button has no "Nothing opened?" hint like the home card: the How to install section with .yak files and terminal commands sits directly below it.
- Facts panel and link cards use bordered rounded cards: same pattern across the whole site, part of its look.
- status-dot TrendChart.tsx:113: chart hover marker.

Worth keeping
- No horizontal scroll at 375; Install hidden on phones with a sentence saying why; per-OS terminal command; real <details> for older releases and long licenses; honest "Not declared" license and "—" for missing data.
- Author page: specific header ("Grasshopper plugins on Rhino's Yak package manager"), real totals, no filler.

Self-check
1. Cover the logo: package page is built from Yak data (builds, Rhino versions, yak commands); not template.
2. Neighbor test: n/a, no new design.
3. Containers: unchanged. 4. Colors: unchanged. 5. Dots: Pre-release pill has text.
6. Task: install section unchanged; version history reached sooner.
7. Detector on app/package: 0 hits.
8. Fresh look: not run (light case, no visual redesign).
9. Not checked: performance, 200% zoom, 768/1920 widths, keyboard tab-through, screen reader, contrast ratios, light mode at 375, dark at 1280.
Checked: tsc --noEmit clean; `next build` exit 0; section order, target heights, thead case, scrollWidth measured in the running export.

Ask first, resolved (user approved)
- format.ts: formatDate now "Jul 4, 2026", formatMonth "Jun 2017". Checked in the running export: version table dates fit without overflow at 1280, no horizontal scroll at 375 on /package/Eddy3D and /stats, no numeric M/D/YYYY dates left on /stats. Truth 3 -> 4, total 22/24.
