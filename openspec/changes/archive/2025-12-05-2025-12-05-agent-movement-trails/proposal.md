# Change: Agent Movement Trails

## Why

Currently, when agents move between nodes in the network visualization, there's no visual indication of where they came from. Users must track agent positions mentally across steps. A lightweight trail showing the last movement would provide immediate visual context for agent traversal patterns without cluttering the display.

## What Changes

- Add a thin arrow line from the agent's previous node to their current node
- Line color matches the agent (blue for blue agent, red for red agent)
- Apply a gradient effect: more transparent at the origin, more opaque near the destination
- Arrow head at the destination to indicate direction of movement
- Trail only visible when agent has moved (not on first appearance or same-node actions)

## Visual Design

- **Line weight**: 2-3 pixels (thin, minimal visual weight)
- **Gradient**: Alpha from ~0.2 at start to ~0.7 at end
- **Arrow head**: Small, subtle indicator at destination
- **Colors**:
  - Blue agent: `[59, 130, 246]` (matching existing highlight)
  - Red agent: `[239, 68, 68]` (matching existing highlight)

## Technical Approach

deck.gl provides several options:
1. **PathLayer with `widthUnits: 'pixels'`** - supports gradient via `getColor` accessor
2. **LineLayer** - simpler but no built-in gradient (would need two overlapping lines)
3. **IconLayer** for arrow heads at destination

Recommended: Use `PathLayer` for the trail line with alpha gradient, plus small `ScatterplotLayer` triangle or `IconLayer` for directional arrow.

## Impact

- Affected specs: `network-visualization`
- Affected code:
  - `src/view/NetworkGraph.tsx` - add trail layer
  - `src/trajectory/types.ts` - may need previous position tracking
  - State management to track previous agent positions across steps
