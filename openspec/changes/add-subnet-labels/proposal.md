# Change: Add subnet labels to network graph

## Why

Users need visual identification of which subnet is which when viewing the network topology. Currently subnets are only distinguished by background color, requiring users to infer identity from host names.

## What Changes

- Add text labels to each subnet region showing the subnet name ("User", "Enterprise", "Op")
- Labels positioned at top-left inside each subnet box
- Labels styled consistently with existing action labels (dark background, light text)

## Impact

- Affected specs: network-graph
- Affected code: `src/view/NetworkGraph.tsx`
