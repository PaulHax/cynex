## ADDED Requirements

### Requirement: ELK Layout Computation

The system SHALL use elkjs to compute subnet positions and a custom centered grid for host positions.

#### Scenario: Layout computation on topology change

- **WHEN** a network topology is provided
- **THEN** the system computes subnet sizes based on host count
- **AND** runs the ELK "layered" algorithm to position subnets
- **AND** returns computed x,y positions for each node

#### Scenario: Hierarchical subnet grouping

- **WHEN** computing the layout
- **THEN** hosts within the same subnet are arranged in a centered grid
- **AND** the number of columns is computed as ceil(sqrt(nodeCount)) to make subnets square-shaped
- **AND** subnet groups are arranged left-to-right based on network hierarchy

#### Scenario: Layout performance

- **WHEN** computing layout for a topology with up to 100 hosts
- **THEN** layout computation completes within 2 seconds

### Requirement: Topology Extraction

The system SHALL extract network topology structure from trajectory JSON files.

#### Scenario: Host extraction

- **WHEN** parsing a trajectory's `network_topology` object
- **THEN** each key becomes a host node
- **AND** host type (server/workstation) is inferred from hostname patterns
- **AND** hostnames containing "Server", "Database", "Auth", "Front" are typed as servers

#### Scenario: Subnet detection from IP addresses

- **WHEN** parsing host network interfaces
- **THEN** hosts are grouped into subnets based on `Interface[].Subnet.network_address`
- **AND** each unique `network_address` creates a distinct subnet group

#### Scenario: Subnet edge generation

- **WHEN** building the topology graph
- **THEN** edges are generated between adjacent subnets
- **AND** edges connect subnet boundaries (right edge of source to left edge of target)

### Requirement: Subnet Metadata

The system SHALL derive subnet labels and ordering from the extracted topology.

#### Scenario: Subnet label derivation

- **WHEN** a subnet contains hosts with a common prefix (User, Enterprise, Op)
- **THEN** the subnet label uses that prefix
- **WHEN** no common prefix is found
- **THEN** the subnet label uses the network address

#### Scenario: Subnet ordering

- **WHEN** multiple subnets exist
- **THEN** subnets are ordered logically: User → Enterprise → Op (matching CAGE-2 topology)
- **AND** this ordering determines left-to-right layout position
- **AND** ordering is based on hostname prefixes, not IP addresses

### Requirement: Node Spacing

The system SHALL provide adequate spacing between nodes to accommodate action labels.

#### Scenario: Node spacing and subnet padding

- **WHEN** computing node positions within a subnet
- **THEN** nodes have adequate spacing between them to accommodate action labels
- **AND** subnets have symmetric left and right padding for balanced appearance
- **AND** subnets have sufficient top padding for action labels on top-row nodes
- **AND** incomplete rows (with fewer nodes) are centered within the subnet

#### Scenario: Defender positioning

- **WHEN** a subnet contains a defender host
- **THEN** the defender is positioned on its own row at the bottom of the subnet
- **AND** the defender is centered horizontally within the subnet
- **AND** the subnet height is increased to accommodate the defender row
