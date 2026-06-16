## 2024-03-24 - Interactive Card Keyboard Bubbling Bug
**Learning:** When making an entire card interactive with `role="button"` and `onKeyDown` handlers for Enter/Space, key presses on interactive children (like nested `<button>` tags) will bubble up to the parent card. If the parent's `onKeyDown` handler does not verify the target, focusing an inner child and pressing Enter/Space will trigger the wrapper's action (e.g., expanding the card) *in addition* to the child's action.
**Action:** Always verify `e.target === e.currentTarget` in wrapper container `onKeyDown` handlers to prevent children from accidentally triggering parent actions.

## 2024-05-15 - [Explicit Async Empty States]
**Learning:** Failing to handle all async states (`isLoading`, `isError`, `isIdle`) in the main content area can lead to confusing blank screens during data fetching. The error state in peripheral components (like the sidebar) is not prominent enough for main content failures.
**Action:** When a main list relies on asynchronous fetching, explicitly render full-sized loading and error empty states in the content area instead of leaving it blank.
## 2025-02-14 - [Dynamic Empty State with Query]
**Learning:** Empty states without specific context leave the user guessing if their search failed or if the app is broken. Showing the user query inside the empty state builds confidence and improves micro-UX.
**Action:** When a user queries a list and no results are found, conditionally display the exact search term back to them in the empty state (e.g., `No results for "term"`) with helpful text about checking for typos.
## 2025-05-07 - Dynamic Empty State with Query
**Learning:** Empty states without specific context leave the user guessing if their search failed or if the app is broken. Showing the user query inside the empty state builds confidence and improves micro-UX.
**Action:** When a user queries a list and no results are found, conditionally display the exact search term back to them in the empty state (e.g., No results for "term") with helpful text about checking for typos.

## 2026-05-08 - Explicit Async Empty States
**Learning:** Failing to handle all async states (`isLoading`, `isError`, `isIdle`) in the main content area can lead to confusing blank screens during data fetching. The error state in peripheral components (like the sidebar) is not prominent enough for main content failures.
**Action:** When a main list relies on asynchronous fetching, explicitly render full-sized loading and error empty states in the content area instead of leaving it blank.
## 2024-05-13 - Scroll to top for infinite lists
**Learning:** For pages with infinite scrolling or very long lists (like the main package list), users can easily get lost or find it tedious to scroll back up to the top navigation/search bar.
**Action:** Implement a floating "Scroll to Top" button that dynamically appears when the user scrolls down, using passive event listeners for performance and proper accessibility attributes for screen readers.

## 2026-05-17 - Adding Tooltips to Native Selects and Inputs
**Learning:** While `aria-label` effectively conveys the purpose of an input or select element to screen reader users, sighted mouse users do not benefit from this invisible metadata. Elements lacking an explicit, visible label can leave users guessing their exact function, particularly native `<select>` dropdowns or text inputs with icons.
**Action:** Consistently add `title` attributes matching the `aria-label` or visible label to native form controls (like `select`, `input`, and `Combobox.Input`) that lack dedicated, adjacent text labels, providing sighted users with helpful hover tooltips.

## 2024-04-29 - [Fix Escape key interaction in Headless UI Combobox]
**Learning:** The `@headlessui/react` `<Combobox>` handles the `Escape` key by closing the popover or clearing the raw input text, but it does not clear the controlled `value` (e.g. the selected object). This creates an inconsistent experience where the user expects `Escape` to clear their selection, similar to a standard clearable search input.
**Action:** When creating custom clearable fields inside `@headlessui/react` Combobox components, explicitly attach an `onKeyDown` handler to the `<Combobox.Input>` to listen for `Escape`. Implement a "smart escape" pattern: if a value is selected or text is present, `Escape` clears the value; if the input is empty and nothing is selected, a subsequent `Escape` blurs the input.

## 2024-05-01 - [Improve Mobile Menu UX and Accessibility]
**Learning:** Custom overlay components like mobile dropdowns or bottom sheets that open over the main content should not rely solely on an explicit 'close' button. Providing a backdrop that users can click to dismiss, along with an `Escape` key listener, significantly improves accessibility and meets standard UX expectations for modals and popovers.
**Action:** When building custom overlay UI elements (like mobile menus), always include a `fixed` backdrop overlay that triggers a close action `onClick`, and attach a `keydown` listener to the document to handle `Escape` key dismissal.

## 2024-05-02 - [Fix Nested Interactive Elements in Cards]
**Learning:** When building clickable card components that contain other interactive elements (like links, author buttons, or expand/collapse chevrons), adding `role="button"` and `tabIndex={0}` to the outer card wrapper creates an invalid DOM structure (nested interactive elements) which breaks screen reader navigation and keyboard focus behavior.
**Action:** Remove `role="button"`, `tabIndex`, and global keyboard listeners from the outer card wrapper. Keep `onClick` on the wrapper for mouse users, but provide a semantic `<button>` inside the card (such as the card's title) with proper ARIA attributes to act as the primary accessible focus target for the card's main action.
## 2025-05-14 - Prevent Focus Drops on State Changes
**Learning:** Components that trigger state changes making them inactive or invisible (like a "Reset" button disabling itself, or a "Scroll to Top" button becoming visually hidden via `invisible` utility) cause the active focus to completely drop to the document body when they are unmounted, hidden, or natively disabled. This disrupts the keyboard navigation flow.
**Action:** Use `aria-disabled="true"` with early handler returns instead of the native `disabled` attribute to maintain semantic inactive state while preserving focus. For elements that genuinely disappear, proactively restore focus to a logically adjacent or primary element (like `document.getElementById('main-content')?.focus()`) before the element is removed from the accessibility tree.

## 2024-06-10 - Fix Author Commas & Empty State Reset

**Learning:** When generating a list of inline interactive elements (like a list of authors as links or buttons), placing the separating punctuation (e.g. commas) inside the button element expands the focus ring, hover state, and accessible name inappropriately. Furthermore, offering a "Clear filters" button when a dataset is natively empty (no filters applied) is a confusing, dead-end action.

**Action:** Extract punctuation outside interactive elements, and conditionally render reset CTAs only when the state represents an actively filtered subset of data.

## 2024-05-20 - Disable Spellcheck and Autocomplete on Custom Search Inputs
**Learning:** Native browser features like spellcheck (red wavy underlines) and autocomplete (browser-provided dropdown histories) can interfere visually and functionally with custom search fields and comboboxes. This is particularly problematic for fields expecting proper nouns (like package names or author names), where almost every query will trigger a false positive spellcheck error.
**Action:** Always add `spellCheck={false}` and `autoComplete="off"` to custom search text inputs and Headless UI Combobox inputs to prevent browser UI from clashing with the application's intended design and to avoid distracting the user with irrelevant spellcheck warnings for proper nouns.
## 2024-05-18 - Improve Mobile Filter Discoverability
**Learning:** Mobile users often forget or are unaware of active filters when the filter menu is closed, leading to confusion about why data is missing or restricted. Additionally, screen readers need to be explicitly informed of this background filter state.
**Action:** When hiding a filter panel behind a mobile toggle (like a hamburger menu), add a visual indicator (such as a dot) to the toggle button and update its `aria-label` to announce "active filters applied" when filters differ from the default state.
## 2024-05-22 - Infinite Scroll Context & Focus Drop Fix
**Learning:** For infinite scroll lists, announcing "Showing page X" to screen reader users lacks necessary context, as the list continually grows. Providing the visible items count against the total filtered count is significantly more helpful. Furthermore, when empty states containing "Clear all filters" buttons resolve (and the button unmounts), keyboard users suffer a focus drop to the document body.
**Action:** Expose the total filtered count from the context to update the `aria-live` region to say "Showing X of Y packages". When resolving empty states via "Clear all filters" actions, explicitly restore focus to the primary container (e.g. `#main-content`) before the button unmounts.
