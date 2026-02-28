# Select Component Implementation

Create a Select component in `src/components/interaction/` that renders options legibly with progressive search when more than numberOptionsToShowSearch options are passed.

Define SelectOption and SelectProps interfaces in types.ts, extending CommonProps with options array, value, onChange, placeholder, label, required, error, size, and numberOptionsToShowSearch (default 9) props.

Create Select.tsx using forwardRef with useState for dropdown state, search term, and highlighted index. Use useEffect for click-outside handling and keyboard navigation. Filter options case-insensitively when search is shown.

Create Select.module.css matching Input styles with base trigger button, dropdown positioning, option hover states, search input styling, size variants, error states, and focus management.

Export Select component and types from index.ts.

Implement controlled dropdown with trigger button showing selected option or placeholder. Show search input only when options exceed numberOptionsToShowSearch. Support arrow key navigation, enter selection, and escape closing.

Ensure legible typography, and responsive touch targets. Follow subtle rounded corners rule and existing design patterns.