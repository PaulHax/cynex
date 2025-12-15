## ADDED Requirements

### Requirement: ELK Layout Computation

The system SHALL use Cytoscape.js with the cytoscape-elk extension to compute node positions for graph visualization.

#### Scenario: Layout computation on topology change

- **WHEN** a network topology is provided
- **THEN** the system creates a Cytoscape graph with nodes and edges
- **AND** runs the ELK "layered" layout algorithm
- **AND** returns computed x,y positions for each node

#### Scenario: Hierarchical subnet grouping

- **WHEN** computing the layout
- **THEN** hosts within the same subnet are placed in a compound parent node
- **AND** the ELK algorithm arranges hosts within each subnet group
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

#### Scenario: Infrastructure node generation

- **WHEN** building the topology graph
- **THEN** one router node is generated per detected subnet
- **AND** firewall nodes are generated between adjacent subnets
- **AND** edges connect hosts to their subnet's router
- **AND** edges connect routers through firewalls

### Requirement: Subnet Metadata

The system SHALL derive subnet labels and ordering from the extracted topology.

#### Scenario: Subnet label derivation

- **WHEN** a subnet contains hosts with a common prefix (User, Enterprise, Op)
- **THEN** the subnet label uses that prefix
- **WHEN** no common prefix is found
- **THEN** the subnet label uses the network address

#### Scenario: Subnet ordering

- **WHEN** multiple subnets exist
- **THEN** subnets are ordered by their network address numerically
- **AND** this ordering determines left-to-right layout position
