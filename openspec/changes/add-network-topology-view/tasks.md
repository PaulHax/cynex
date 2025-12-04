## 1. Trajectory Domain

- [ ] 1.1 Create `src/trajectory/types.ts` with TypeScript interfaces for trajectory JSON
- [ ] 1.2 Create `src/trajectory/loader.ts` to load and parse JSON from public/data/

## 2. Network Domain

- [ ] 2.1 Create `src/network/topology.ts` with CAGE 2 host positions, types (server/workstation), subnet definitions, and edge connectivity including firewall links
- [ ] 2.2 Create `src/network/colors.ts` with color constants for agents, node states, and subnets

## 3. View Layer

- [ ] 3.1 Create `src/view/NetworkGraph.tsx` using deck.gl ScatterplotLayer for nodes
- [ ] 3.2 Add deck.gl LineLayer for network edges with firewall boundaries styled distinctly
- [ ] 3.3 Add subnet background regions to NetworkGraph
- [ ] 3.4 Create `src/view/ActionPanel.tsx` to display current step's actions
- [ ] 3.5 Create `src/view/StepControls.tsx` for step navigation buttons

## 4. Integration

- [ ] 4.1 Wire up NetworkGraph to highlight action targets at current step
- [ ] 4.2 Add sample trajectory JSON to `public/data/trajectories/`
- [ ] 4.3 Update App.tsx layout with NetworkGraph, ActionPanel, and StepControls

## 5. Verification

- [ ] 5.1 Set up Playwright with `npm init playwright`
- [ ] 5.2 Create `e2e/network-view.spec.ts` to verify NetworkGraph, ActionPanel, and StepControls render
