# Change: Add Zoom to Fit on Trajectory Load

## Why

When loading a new trajectory JSON, the camera centers on the topology but always sets `zoom: 0` regardless of network size or viewport dimensions. This causes larger topologies (46+ hosts) to extend beyond the visible viewport, requiring manual zoom-out to see the full network. Users expect the entire network to be visible when loading a new file.

## What Changes

- **Modify `network-graph`** - Calculate zoom level that fits the entire topology within the viewport when a new trajectory is loaded
- Compute zoom based on topology bounding box and container size
- Add padding around the fitted view to prevent nodes at edges from being clipped
- Trigger zoom-to-fit whenever topology changes (new JSON loaded)

## Impact

- Affected specs: `network-graph`
- Affected code:
  - `src/view/NetworkGraph.tsx` - Calculate fit zoom in the topology change effect
