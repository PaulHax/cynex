# Change: Fix agent action tooltip overlap

## Why

When the red agent acts on a host directly above where the blue agent is acting, their action tooltips overlap. This happens because red tooltips appear below their host while blue tooltips appear above their host, causing a collision in the vertical gap between adjacent hosts. Additionally, when zoomed out, labels can overlap even on non-adjacent hosts since label size stays fixed while node spacing shrinks.

## What Changes

- Both agent tooltips now appear above their target node (instead of red below, blue above)
- Dynamic collision detection calculates screen-space bounding boxes for all tooltips
- When overlaps are detected, tooltips are nudged horizontally until clear
- Collision detection runs on each render to handle zoom changes

## Impact

- Affected specs: action-overlays
- Affected code: ActionTooltip layer positioning logic, new collision detection utility
