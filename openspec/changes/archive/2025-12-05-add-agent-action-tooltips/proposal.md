# Change: Add Agent Action Tooltips and Success/Failure Status

## Why
Users need immediate visual feedback showing what action each agent is currently taking and whether actions succeeded or failed. The Status field exists in trajectory data but is not displayed anywhere in the UI.

## What Changes
- Add floating tooltip-style bubbles above the target node showing the current agent action
- Bubbles display action type (e.g., "ExploitRemoteService", "Restore") and success/failure status
- Bubbles are color-coded by agent (blue/red) and positioned above the target node
- Add success/failure indicator (✓/✗) to action history list in sidebar

## Impact
- Affected specs: network-visualization
- Affected code: src/view/NetworkGraph.tsx, src/view/ActionHistory.tsx
