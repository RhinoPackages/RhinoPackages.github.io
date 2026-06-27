## 2026-06-20 - De-noise Repetitive Decorative Images
**Learning:** When listing repetitive items (like a list of package cards), having multiple small visual icons (like platform compatibilities) read out individually for every single list item creates severe auditory clutter for screen reader users.
**Action:** Hide repetitive decorative icons from screen readers using `aria-hidden="true"` and aggregate their meaning into a single, clean `.sr-only` text span placed just before the icon group.

## 2026-06-22 - Group related form checkboxes
**Learning:** When listing adjacent checkboxes in a filter panel, screen readers read them sequentially without context, making it hard to understand what category they belong to.
**Action:** Wrap related checkbox groups in a `<fieldset>` and add a `<legend className="sr-only">` to explicitly label the filter category for assistive technology.

## 2026-06-25 - Explicit aria-keyshortcuts for hidden keyboard shortcuts
**Learning:** Screen reader users are often unaware of custom keyboard shortcuts implemented via React keydown listeners (e.g., pressing `/` to focus a search input, or `Escape` to clear a combobox), as visual `<kbd>` hints might be hidden or missed.
**Action:** Explicitly add the `aria-keyshortcuts` attribute (e.g., `aria-keyshortcuts="/"` or `aria-keyshortcuts="Escape"`) to inputs and buttons that respond to these global or component-level keyboard shortcuts to ensure assistive technologies announce them.
