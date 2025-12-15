# Change: Add Dynamic Network Layout with Cytoscape.js-ELK

## Why

The current implementation has hardcoded positions for the 14-host CAGE Challenge 2 topology. Scalability experiments now produce trajectories with arbitrary network sizes (46+ hosts in hosts3, 61+ hosts in hosts4). The visualization cannot display these larger topologies because node positions are statically defined in `topology.ts`.

## What Changes

- **New capability: `graph-layout`** - Handles topology extraction and ELK layout computation
- Add `cytoscape` and `cytoscape-elk` (which bundles `elkjs`) as dependencies
- Create layout computation module using Cytoscape.js + ELK for position calculation
- Extract subnet groupings from host IP addresses in `network_topology` JSON
- Use ELK's hierarchical "layered" algorithm to position hosts by subnet
- **Modify `network-visualization`** - Use computed positions instead of hardcoded topology
- Keep deck.gl for rendering (performant WebGL, already working well)

## Impact

- Affected specs:
  - `graph-layout` (new capability)
  - `network-visualization` (modified to use computed positions)
- Affected code:
  - `src/network/extractTopology.ts` - New: parse topology from trajectory JSON
  - `src/network/computeLayout.ts` - New: ELK layout computation
  - `src/network/topology.ts` - Remove hardcoded definitions
  - `src/view/NetworkGraph.tsx` - Accept dynamic topology as props
- Dependencies: Add `cytoscape`, `cytoscape-elk`
