# Change: Add Network Topology Visualization

## Why

The core value of Cynex is visualizing agent trajectories on a network graph. Before adding playback, filtering, or comparison features, we need the foundational visualization: rendering the CAGE 2 network topology with hosts as nodes and showing agent actions at each step.

## What Changes

- Add TypeScript interfaces for trajectory JSON schema
- Add CAGE 2 network topology constants (14 hosts, 3 subnets)
- Add deck.gl-based NetworkGraph component rendering nodes
- Add basic step navigation to view actions at different timesteps
- Add ActionPanel showing current step's blue/red actions

## Impact

- Affected specs: `network-visualization` (new capability)
- Affected code: `src/trajectory/`, `src/network/`, `src/view/`, `App.tsx`
