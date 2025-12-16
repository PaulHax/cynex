# network-graph Specification

## Purpose

Render network topologies as interactive graphs with visual encoding for host type and compromise state.
## Requirements
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
- **AND** subnet background polygons resize to contain their hosts

#### Scenario: Zoom to fit on trajectory load

- **WHEN** a new trajectory is loaded
- **THEN** the camera SHALL zoom and center to fit the entire network topology within the viewport
- **AND** the zoom level is computed from the topology bounding box and viewport dimensions
- **AND** padding is applied to prevent nodes at edges from being clipped
- **AND** the fit calculation uses subnet bounds (not just host positions) to include full subnet backgrounds

#### Scenario: Display subnet labels

- **WHEN** the topology is rendered
- **THEN** each subnet region displays a text label just outside the top-left corner of the subnet box
- **AND** labels show the short subnet name (e.g., "User", "Enterprise", "Op")
- **AND** labels are rendered using deck.gl TextLayer
- **AND** label styling is consistent with action labels (dark background, light text)

### Requirement: Node Visual Encoding

The system SHALL encode host type and state through node appearance.

#### Scenario: Host type shapes

- **WHEN** nodes are rendered
- **THEN** server hosts (Enterprise0-2, Op_Server) are displayed as squares
- **AND** workstation hosts (User0-4, Op_Host0-2, Defender) are displayed as circles

#### Scenario: Clean host

- **WHEN** a host has not been compromised at the current step
- **THEN** the node is displayed in its base type color (gray)

#### Scenario: Compromised host

- **WHEN** a host has been successfully attacked by the red agent
- **AND** has not been restored by the blue agent since
- **THEN** the node fill color is orange to indicate compromise

#### Scenario: Restored host

- **WHEN** a host was previously compromised
- **AND** the blue agent has successfully executed a Restore action on it
- **THEN** the node returns to its clean base type color

#### Scenario: Compromise state progression

- **WHEN** the user navigates to a different step
- **THEN** node colors reflect the cumulative compromise state up to that step
- **AND** compromise is determined by successful red ExploitRemoteService, PrivilegeEscalate, or Impact actions
- **AND** restoration is determined by successful blue Restore actions

#### Scenario: Action target highlight

- **WHEN** a host is the target of the current step's action
- **THEN** the node border is colored by agent (blue for defender, red for attacker)
- **AND** the border highlight is applied in addition to any compromise fill color

### Requirement: Accumulated Movement Trails

The system SHALL display agent movement trails for all movements within the selected step range.

#### Scenario: Render trail for each movement in range

- **WHEN** a step range [start, end] is selected
- **AND** agents moved between hosts within that range
- **THEN** a trail segment is rendered for each movement
- **AND** each trail uses the agent's color (blue/red)
- **AND** each trail uses the existing gradient effect (faint at origin, solid at destination)

#### Scenario: Multiple trails displayed

- **WHEN** multiple movements occurred in the range
- **THEN** all trail segments are visible simultaneously
- **AND** trails may overlap if agents visited the same paths

#### Scenario: Empty range trails

- **WHEN** no agent movements occurred in the selected range
- **THEN** no trails are displayed

#### Scenario: Node state at range end

- **WHEN** a step range is selected
- **THEN** node compromise states reflect the cumulative state at range end
- **AND** action labels show actions at range end

