# Change: Agent Visibility Toggle

## Why

The emoji icons (🔵 🔴) next to agent labels in the sidebar have shading that doesn't match the flat visual style of the application. Additionally, users need a way to toggle agent visibility in the network graph to focus on specific agent activity.

## What Changes

- Remove emoji icons from blue and red agent labels in the sidebar header
- Add eye visibility toggle buttons next to each agent label
- Implement visibility state that controls display of agent trails and action overlays in the network graph
- Hidden agents should not render their trails, action labels, or host highlights

## Impact

- Affected specs: action-sidebar, network-graph
- Affected code: `src/view/ActionHistory.tsx`, `src/view/NetworkGraph.tsx`, `src/App.tsx`
