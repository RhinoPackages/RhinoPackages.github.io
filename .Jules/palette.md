## 2024-05-18 - Input Escape Pattern
**Learning:** When inputs have clearable content, `Escape` should intuitively clear the content first, and blur on the second `Escape` press. Overriding `Escape` blurs aggressively and frustrates users.
**Action:** Use conditional `onKeyDown` logic checking `e.currentTarget.value` to clear text if present, otherwise blur.
