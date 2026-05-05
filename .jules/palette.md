## 2024-03-24 - Interactive Card Keyboard Bubbling Bug
**Learning:** When making an entire card interactive with `role="button"` and `onKeyDown` handlers for Enter/Space, key presses on interactive children (like nested `<button>` tags) will bubble up to the parent card. If the parent's `onKeyDown` handler does not verify the target, focusing an inner child and pressing Enter/Space will trigger the wrapper's action (e.g., expanding the card) *in addition* to the child's action.
**Action:** Always verify `e.target === e.currentTarget` in wrapper container `onKeyDown` handlers to prevent children from accidentally triggering parent actions.

## 2024-05-15 - [Explicit Async Empty States]
**Learning:** Failing to handle all async states (`isLoading`, `isError`, `isIdle`) in the main content area can lead to confusing blank screens during data fetching. The error state in peripheral components (like the sidebar) is not prominent enough for main content failures.
**Action:** When a main list relies on asynchronous fetching, explicitly render full-sized loading and error empty states in the content area instead of leaving it blank.
## 2025-02-14 - [Dynamic Empty State with Query]
**Learning:** Empty states without specific context leave the user guessing if their search failed or if the app is broken. Showing the user query inside the empty state builds confidence and improves micro-UX.
**Action:** When a user queries a list and no results are found, conditionally display the exact search term back to them in the empty state (e.g., `No results for "term"`) with helpful text about checking for typos.
