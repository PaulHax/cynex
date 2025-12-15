# Change: Split network-visualization spec into focused capabilities

## Why

The `network-visualization` spec (302 lines, 8 requirements) violates OpenSpec best practices:
- Fails the "single purpose" test - covers graph rendering, sidebar UI, playback, data loading, and overlays
- Fails the "10-minute understandability" rule - too much to digest quickly
- Fails the "split if description needs AND" test - requires multiple ANDs to describe

## What Changes

- **REMOVED**: `specs/network-visualization/` - monolithic spec retired
- **ADDED**: `specs/trajectory-loading/` - file loading, dropdown, drag-drop
- **ADDED**: `specs/network-graph/` - topology display and node visual encoding
- **ADDED**: `specs/action-sidebar/` - action panel UI and success status display
- **ADDED**: `specs/playback-controls/` - step navigation
- **ADDED**: `specs/action-overlays/` - agent movement trails and action tooltips

## Impact

- Affected specs: `network-visualization` (removed), 5 new specs created
- Affected code: None - this is a spec reorganization only, no code changes required
- Aligns specs with existing `src/` directory structure
