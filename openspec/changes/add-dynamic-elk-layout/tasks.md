## 1. Dependencies

- [ ] 1.1 Install `cytoscape` and `cytoscape-elk` packages
- [ ] 1.2 Add TypeScript types for cytoscape (`@types/cytoscape`)

## 2. Topology Extraction

- [ ] 2.1 Create `src/network/extractTopology.ts` to parse `network_topology` from trajectory JSON
- [ ] 2.2 Extract subnet groupings from host IP addresses (group by network_address)
- [ ] 2.3 Generate host definitions with type inference (server vs workstation from hostname patterns)
- [ ] 2.4 Generate infrastructure nodes (one router per subnet, firewalls between subnets)
- [ ] 2.5 Generate edges connecting hosts to their subnet's router and routers through firewalls

## 3. Layout Computation

- [ ] 3.1 Create `src/network/computeLayout.ts` module
- [ ] 3.2 Convert extracted topology to Cytoscape.js elements format
- [ ] 3.3 Configure ELK layout with hierarchical algorithm and subnet grouping (compound nodes)
- [ ] 3.4 Run layout and extract computed positions
- [ ] 3.5 Return positions compatible with existing deck.gl rendering

## 4. Integration

- [ ] 4.1 Update `NetworkGraph.tsx` to accept dynamic topology as props
- [ ] 4.2 Create hook `useNetworkTopology` that computes layout when trajectory changes
- [ ] 4.3 Connect layout computation to trajectory loading flow
- [ ] 4.4 Update subnet background polygons to be dynamically sized based on node positions

## 5. Backward Compatibility

- [ ] 5.1 Ensure CAGE2 14-host trajectories still render correctly
- [ ] 5.2 Test with hosts3 trajectories (46 hosts)
- [ ] 5.3 Test with hosts4 trajectories (61 hosts)

## 6. Cleanup

- [ ] 6.1 Remove hardcoded topology definitions from `topology.ts`
- [ ] 6.2 Update exports to provide dynamic topology building functions
