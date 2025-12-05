# Implementation Tasks

## Research

- [x] Verify deck.gl PathLayer supports per-vertex alpha for gradient effect
- [x] Determine if arrow heads need IconLayer or can use PathLayer `capRounded` + scaling trick
  - Initially used PolygonLayer for triangular arrow heads, later removed per user feedback

## Implementation

- [x] Add previous position tracking for blue and red agents
  - Pass `previousBlueAction` and `previousRedAction` props from App.tsx
- [x] Create trail data structure
  - Source position (previous node x,y)
  - Target position (current node x,y)
  - Agent color with gradient alpha
- [x] Add new deck.gl layer(s) for trails
  - PathLayer for gradient line segment (renders on top of nodes)
- [x] Style the trail
  - 3px width, capRounded
  - Gradient alpha (20 → 180)
  - Agent-matching color (blue/red)
  - 20px gap from node edges (zoom-invariant using worldGap = pixelGap / 2^zoom)
- [x] Handle edge cases
  - First step (no previous position) - no trail
  - Same-node action - no trail
  - Agent not present in current step - clear trail

## Testing

- [x] Visual verification of trail rendering
- [x] Verify gradient direction (faded at origin, solid at destination)
- [x] Verify correct colors for each agent
- [x] Test step navigation (forward/backward) updates trails correctly
- [x] Verify gap remains consistent across zoom levels
