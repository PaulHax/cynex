# Change: Add Collapsible Sidebar with Side-by-Side Layout

## Why
The current layout has the sidebar absolutely positioned over the deck.gl viewport, which fills the entire viewport. This wastes space and creates visual clutter since the sidebar floats over the graph rather than sitting beside it.

## What Changes
- Change layout from absolute positioning to flexbox side-by-side layout
- Sidebar and NetworkGraph sit next to each other horizontally
- NetworkGraph no longer fills the entire viewport, just its flex container
- Add collapse/expand toggle button to the sidebar
- When collapsed, sidebar shows only the toggle button
- When expanded, sidebar shows full content at fixed width

## Impact
- Affected specs: network-visualization
- Affected code: `src/App.tsx`, `src/view/NetworkGraph.tsx`
