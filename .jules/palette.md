## 2024-03-24 - Interactive Card Keyboard Bubbling Bug
**Learning:** When making an entire card interactive with `role="button"` and `onKeyDown` handlers for Enter/Space, key presses on interactive children (like nested `<button>` tags) will bubble up to the parent card. If the parent's `onKeyDown` handler does not verify the target, focusing an inner child and pressing Enter/Space will trigger the wrapper's action (e.g., expanding the card) *in addition* to the child's action.
**Action:** Always verify `e.target === e.currentTarget` in wrapper container `onKeyDown` handlers to prevent children from accidentally triggering parent actions.

## 2024-05-15 - [Explicit Async Empty States]
**Learning:** Failing to handle all async states (`isLoading`, `isError`, `isIdle`) in the main content area can lead to confusing blank screens during data fetching. The error state in peripheral components (like the sidebar) is not prominent enough for main content failures.
**Action:** When a main list relies on asynchronous fetching, explicitly render full-sized loading and error empty states in the content area instead of leaving it blank.
## 2024-05-24 - Interactive Cards Avoid Nested Controls
**Learning:** Adding `role="button"` and `tabIndex={0}` to an entire card wrapper that already contains other interactive elements (links, copy buttons, etc.) creates an invalid DOM structure and confusing screen reader experience (nested controls).
**Action:** When a whole card needs to be clickable, remove the overarching button role. Instead, make the title a `<button>` that handles the main action and ensure the parent `onClick` still works for mouse users without hijacking the accessibility tree.
