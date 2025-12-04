# Change: Add Trajectory Selector

## Why

Currently the app only loads a hardcoded default trajectory. Users need to swap files manually to visualize different agent trajectories. A trajectory selector would allow loading trajectory files via file picker, drag-and-drop, or from a local trajectories folder (gitignored).

## What Changes

- Add dropdown for trajectories in `public/data/trajectories/` folder (gitignored, built/copied in by user)
- Add file input button to load local JSON files
- Add drag-and-drop zone for trajectory JSON files
- Display current trajectory name/metadata in the UI
- Gitignore the trajectories folder so files aren't checked in

## Impact

- Affected specs: `network-visualization` (modifies Trajectory Loading requirement)
- Affected code: `src/trajectory/loader.ts`, `src/App.tsx`, new component in `src/view/`, `.gitignore`
