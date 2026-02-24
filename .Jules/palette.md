## 2024-05-23 - Sidebar Filter Accessibility
**Learning:** Multiple input controls in the sidebar (`SearchBar`, `OwnersControl`, `Sort`) were missing labels. This pattern suggests a focus on visual density over accessibility in filter panels.
**Action:** When working on filter panels, proactively audit all inputs for accessible names, as space-saving designs often omit visible labels.

## 2026-02-24 - Keyboard Accessibility in Clickable Cards
**Learning:** The `PackageCard` used a `div` with `onClick` for expanding details, which is inaccessible to keyboard users. This "clickable card" pattern is common but often excludes keyboard users if not implemented with a dedicated button or appropriate ARIA roles.
**Action:** Always check clickable cards for keyboard accessibility and add a dedicated toggle button if the whole card cannot be a button (e.g., due to nested interactive elements).
