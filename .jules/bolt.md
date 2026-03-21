## 2025-02-23 - [Sorting Performance Bottleneck]
**Learning:** React context filtering/sorting can be a major bottleneck if complex calculations (like `new Date()`) are performed inside the `sort` comparator.
**Action:** Always pre-calculate expensive metrics (like scores or dates) outside the sort loop, especially when dealing with thousands of items.
