
## 2024-04-29 - [Fix Escape key interaction in Headless UI Combobox]
**Learning:** The `@headlessui/react` `<Combobox>` handles the `Escape` key by closing the popover or clearing the raw input text, but it does not clear the controlled `value` (e.g. the selected object). This creates an inconsistent experience where the user expects `Escape` to clear their selection, similar to a standard clearable search input.
**Action:** When creating custom clearable fields inside `@headlessui/react` Combobox components, explicitly attach an `onKeyDown` handler to the `<Combobox.Input>` to listen for `Escape`. Implement a "smart escape" pattern: if a value is selected or text is present, `Escape` clears the value; if the input is empty and nothing is selected, a subsequent `Escape` blurs the input.

## 2024-05-01 - [Improve Mobile Menu UX and Accessibility]
**Learning:** Custom overlay components like mobile dropdowns or bottom sheets that open over the main content should not rely solely on an explicit 'close' button. Providing a backdrop that users can click to dismiss, along with an `Escape` key listener, significantly improves accessibility and meets standard UX expectations for modals and popovers.
**Action:** When building custom overlay UI elements (like mobile menus), always include a `fixed` backdrop overlay that triggers a close action `onClick`, and attach a `keydown` listener to the document to handle `Escape` key dismissal.
