# Change: Full-width Playback Bar

## Why
The current playback controls are nested within the sidebar, which limits the available width for the range slider and makes the controls feel cramped. Moving them to a full-width bar at the bottom of the viewport improves accessibility and provides more space for visualizing the trajectory timeline.

## What Changes
- **MODIFIED** Layout: The main application layout changes from a horizontal flex row to a vertical flex column with the sidebar + main view on top and playback bar at the bottom.
- **MODIFIED** Playback Controls: `StepControls` is moved from the sidebar to a full-width footer.
- **MODIFIED** Styling: `StepControls` is restyled as a single-line horizontal bar with buttons on the left, step counter in the middle, and range slider filling the remaining space on the right. Background matches the sidebar (`bg-slate-900`).

## Impact
- Affected specs: `specs/playback-controls/spec.md`
- Affected code: `src/App.tsx`, `src/view/StepControls.tsx`
