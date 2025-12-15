## MODIFIED Requirements

### Requirement: Network Topology Display

The system SHALL render network topologies as an interactive graph with host nodes arranged by subnet, supporting arbitrary network sizes from the loaded trajectory JSON.

Node positions are computed by the `graph-layout` capability and provided to the visualization layer.

#### Scenario: Initial render with arbitrary topology

- **WHEN** a trajectory is loaded
- **THEN** all hosts from `network_topology` are displayed as nodes
- **AND** nodes are positioned using computed layout from graph-layout capability
- **AND** nodes are grouped visually by their detected subnet
- **AND** subnet regions have distinct background colors

#### Scenario: Display network edges

- **WHEN** the topology is rendered
- **THEN** edges are drawn between adjacent subnets at their boundaries
- **AND** edges connect from right edge of source subnet to left edge of target subnet
- **AND** edges are visually distinct (firewall color) to indicate network boundaries

#### Scenario: Support varying network sizes

- **WHEN** a trajectory with N hosts is loaded (where N can be 14, 46, 61, or other)
- **THEN** all N hosts are displayed with computed positions
- **AND** the viewport auto-fits to show all nodes
- **AND** subnet background polygons resize to contain their hosts
