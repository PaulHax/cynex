# Change: Move Action Panel to Left Side

## Why
The action panel (steps, metrics, action history) is currently on the right side of the screen. Moving it to the left, between the trajectory selector header and the playback controls at the bottom, creates a more logical vertical flow for the control UI.

## What Changes
- Create a left sidebar flex container that spans the full height
- Trajectory selector (fixed height) at top
- Action panel (flex-grow to fill available space) in middle
- Playback controls (fixed height) at bottom
- Remove absolute positioning in favor of reactive flex layout

## Impact
- Affected specs: network-visualization (Action Panel requirement)
- Affected code: `src/App.tsx` (layout structure)
