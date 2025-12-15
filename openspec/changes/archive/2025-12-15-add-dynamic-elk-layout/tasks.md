## 1. Dependencies

- [x] 1.1 Install `elkjs` package (used directly instead of cytoscape-elk for layout-only computation)
- [x] ~~1.2 Add TypeScript types for cytoscape~~ (not needed - elkjs has built-in types)

## 2. Topology Extraction

- [x] 2.1 Create `src/network/extractTopology.ts` to parse `network_topology` from trajectory JSON
- [x] 2.2 Extract subnet groupings from host IP addresses (group by network_address)
- [x] 2.3 Generate host definitions with type inference (server vs workstation from hostname patterns)
- [x] 2.4 Generate infrastructure nodes (one router per subnet, firewalls between subnets)
- [x] 2.5 Generate edges connecting hosts to their subnet's router and routers through firewalls

## 3. Layout Computation

- [x] 3.1 Create `src/network/computeLayout.ts` module
- [x] 3.2 Convert extracted topology to ELK graph format (compound nodes for subnets)
- [x] 3.3 Configure ELK layout with hierarchical "layered" algorithm and subnet grouping
- [x] 3.4 Run layout and extract computed positions
- [x] 3.5 Return positions compatible with existing deck.gl rendering

## 4. Integration

- [x] 4.1 Update `NetworkGraph.tsx` to accept dynamic topology as props
- [x] 4.2 Create hook `useNetworkTopology` that computes layout when trajectory changes
- [x] 4.3 Connect layout computation to trajectory loading flow
- [x] 4.4 Update subnet background polygons to be dynamically sized based on node positions

## 5. Backward Compatibility

- [x] 5.1 Ensure CAGE2 14-host trajectories still render correctly
- [x] 5.2 Test with hosts3 trajectories (46 hosts) - N/A: trajectory files not available
- [x] 5.3 Test with hosts4 trajectories (61 hosts) - N/A: trajectory files not available

## 6. Cleanup

- [x] 6.1 Remove hardcoded topology definitions from `topology.ts`
- [x] 6.2 Update exports to provide dynamic topology building functions
