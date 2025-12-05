# Change: Add Agent Action History Panel

## Why

Currently the sidebar only shows the current step's actions. Users need to see the full history of actions taken by both agents to understand the progression of the attack and defense, enabling better analysis of agent behavior patterns.

## What Changes

- Reorganize sidebar layout: metrics card at top, current step indicator below
- Add two-column action history showing past actions for blue and red agents
- Current action highlights/integrates with the history timeline
- History scrolls independently while current action remains visible

## Impact

- Affected specs: network-visualization (Action Panel requirement)
- Affected code: `src/view/ActionPanel.tsx`, potentially `src/App.tsx` for passing action arrays
