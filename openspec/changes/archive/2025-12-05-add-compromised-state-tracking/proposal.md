# Change: Add Compromised State Tracking

## Why
Nodes currently only show the target of the current step's action. Users need to see which hosts have been compromised by the red agent and which have been restored by the blue agent across the trajectory timeline.

## What Changes
- Track cumulative compromise state derived from red/blue action history
- Color nodes orange when compromised by successful red agent attacks
- Reset node color when blue agent successfully restores the host
- Show compromise state progression as user navigates through steps

## Impact
- Affected specs: network-visualization
- Affected code: src/network/colors.ts (already has NODE_STATE_COLORS), src/view/NetworkGraph.tsx, new state derivation logic
