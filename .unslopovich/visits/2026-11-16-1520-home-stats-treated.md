Dr. Unslopovich's treatment, follow-up to 2026-11-16-1345-home-stats.md
Case: light. Findings fixed in place; palette, type and layout kept.
Score: 21/24 Discharged (was 19)  Task path 3 -> 4 · Truth 3 -> 4 · Native fit 4 · States ~3 · Access ~3 · Specificity 3
Self-scored; the Access and States scores were not re-measured.

Changed
- Install (PackageList.tsx): after a click, the card shows "Nothing opened? Get the .yak file or terminal command →" (md and up, live region).
- Motion: ScrollToTop honors prefers-reduced-motion; card chevron, quick view, scroll button, stats bars get `motion-reduce:transition-none`. All `transition-all` replaced with named properties. Contributor avatars fade on hover instead of scaling.
- Stats: tracked small-caps labels and title case gone (sentence case, normal tracking); `.pkg-label` likewise. Nonzero shares under 0.5% show "<1%". Loading box fills the viewport so the footer does not jump.
- Error page: no icon circle, says the page failed to load, offers Try again and a link to /packages.
- Copy: "most comprehensive" removed from the site and meta descriptions and the first FAQ answer; now "every package on Yak".
- Quick-view "All N keywords →" link has py-1.5 (28px target).

Detector: 24 hits -> 4, all dismissed false positives (HomePageClient.tsx:174, :167; layout.tsx:209; TrendChart.tsx:113).
Checked: tsc --noEmit clean; /stats and / seen running at 1280 (light); Install hint confirmed by a scripted click with navigation blocked.
Not checked: error page rendered, reduced-motion emulation, phone widths after the change, dark mode after the change, package page and FAQ rendering, any build (`next build`), performance. Left alone on purpose: the 1.2 MB initialCache payload (measure first).
