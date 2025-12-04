# network-visualization Specification

## Purpose
TBD - created by archiving change add-network-topology-view. Update Purpose after archive.
## Requirements
### Requirement: Network Topology Display

The system SHALL render the CAGE 2 network topology as an interactive graph with 14 host nodes arranged by subnet, following this structure:

- **Subnet 1 (User)**: User0, User1, User2, User3, User4 - workstation hosts
- **Subnet 2 (Enterprise)**: Enterprise0, Enterprise1, Enterprise2 (servers) + Defender (workstation)
- **Subnet 3 (Op)**: Op_Host0, Op_Host1, Op_Host2 (workstations) + Op_Server (server)

Network connectivity:
- Hosts within a subnet connect through a router
- Subnet 1 connects to Subnet 2 through a firewall
- Subnet 2 connects to Subnet 3 through a firewall

#### Scenario: Initial render

- **WHEN** a trajectory is loaded
- **THEN** all 14 hosts are displayed as nodes
- **AND** nodes are grouped visually by subnet (User, Enterprise, Op)
- **AND** subnet regions have distinct background colors

#### Scenario: Display network edges

- **WHEN** the topology is rendered
- **THEN** edges are drawn showing connectivity between hosts
- **AND** firewall boundaries between subnets are visually distinct (dashed or different color)

### Requirement: Node Visual Encoding

The system SHALL encode host type and state through node appearance.

#### Scenario: Host type shapes

- **WHEN** nodes are rendered
- **THEN** server hosts (Enterprise0-2, Op_Server) are displayed as squares
- **AND** workstation hosts (User0-4, Op_Host0-2, Defender) are displayed as circles

#### Scenario: Clean host

- **WHEN** a host has not been compromised
- **THEN** the node is displayed in gray

#### Scenario: Action target highlight

- **WHEN** a host is the target of the current step's action
- **THEN** the node border is colored by agent (blue for defender, red for attacker)

### Requirement: Action Panel

The system SHALL display the current step's actions in a side panel.

#### Scenario: Display step actions

- **WHEN** viewing a step
- **THEN** the panel shows the step number
- **AND** shows the blue agent's action type, target host, and success/failure status
- **AND** shows the red agent's action type, target host, and success/failure status

### Requirement: Step Navigation

The system SHALL allow navigating between trajectory steps.

#### Scenario: Step forward

- **WHEN** the user clicks the next step button
- **THEN** the current step increments by 1
- **AND** the visualization updates to reflect the new step's state

#### Scenario: Step backward

- **WHEN** the user clicks the previous step button
- **THEN** the current step decrements by 1
- **AND** the visualization updates to reflect the new step's state

### Requirement: Trajectory Loading

The system SHALL load trajectory data from JSON files and provide multiple methods for users to select trajectories.

#### Scenario: Application start with no trajectories

- **WHEN** the application starts
- **AND** no trajectory files exist in `public/data/trajectories/`
- **THEN** the app displays a prompt to load a trajectory file

#### Scenario: Application start with available trajectories

- **WHEN** the application starts
- **AND** trajectory files exist in `public/data/trajectories/`
- **THEN** the dropdown shows available trajectories
- **AND** the first trajectory is loaded by default

#### Scenario: Select trajectory from dropdown

- **WHEN** the user selects a trajectory from the dropdown menu
- **THEN** the selected trajectory is loaded
- **AND** the visualization resets to step 0
- **AND** the trajectory metadata is displayed

#### Scenario: Load local file via file picker

- **WHEN** the user clicks the file input button
- **AND** selects a valid trajectory JSON file
- **THEN** the file is parsed and loaded
- **AND** the visualization resets to step 0

#### Scenario: Load file via drag and drop

- **WHEN** the user drags a JSON file over the drop zone
- **THEN** the drop zone highlights to indicate it accepts the file
- **WHEN** the user drops the file
- **THEN** the file is parsed and loaded
- **AND** the visualization resets to step 0

#### Scenario: Invalid file format

- **WHEN** the user attempts to load a file that is not valid trajectory JSON
- **THEN** an error message is displayed
- **AND** the current trajectory remains unchanged

