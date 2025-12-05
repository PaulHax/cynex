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

### Requirement: Action Panel

The system SHALL display the current step's actions in a side panel positioned on the left side of the screen within a flex container, showing metrics, current step, and action history. The sidebar SHALL be collapsible.

#### Scenario: Side-by-side layout

- **WHEN** viewing the application with a loaded trajectory
- **THEN** the sidebar and network graph are displayed side-by-side using flexbox
- **AND** the sidebar takes a fixed width when expanded
- **AND** the network graph fills the remaining horizontal space
- **AND** both sidebar and graph fill the full viewport height

#### Scenario: Left sidebar layout

- **WHEN** viewing the application with a loaded trajectory
- **THEN** a left sidebar contains the trajectory selector, action panel, and playback controls
- **AND** the trajectory selector is at the top with fixed height
- **AND** the action panel fills the available space between selector and controls
- **AND** the playback controls are at the bottom with fixed height
- **AND** the layout is reactive (no hardcoded pixel offsets)

#### Scenario: Collapse sidebar

- **WHEN** the user clicks the collapse toggle button
- **AND** the sidebar is currently expanded
- **THEN** the sidebar collapses to show only the toggle button
- **AND** the network graph expands to fill the freed space

#### Scenario: Expand sidebar

- **WHEN** the user clicks the expand toggle button
- **AND** the sidebar is currently collapsed
- **THEN** the sidebar expands to show full content
- **AND** the network graph shrinks to accommodate the sidebar

#### Scenario: Panel layout order

- **WHEN** viewing the action panel
- **THEN** the current step indicator is displayed at the top
- **AND** the metrics card (C/I/A/Resilience) is displayed below the step indicator
- **AND** the action history columns are displayed below the metrics

#### Scenario: Display step actions

- **WHEN** viewing a step
- **THEN** the panel shows the step number
- **AND** shows the blue agent's action type, target host, and success/failure status
- **AND** shows the red agent's action type, target host, and success/failure status

#### Scenario: Two-column action history

- **WHEN** viewing the action panel
- **THEN** action history is displayed with blue and red columns side by side
- **AND** each row shows the same step for both agents
- **AND** actions are listed from step 0 to the current step
- **AND** a single scrollbar controls both columns together

#### Scenario: Current action highlight

- **WHEN** viewing the action history
- **THEN** the current step's action for each agent is visually highlighted
- **AND** the current action integrates with the history list (not displayed separately)
- **AND** the history auto-scrolls to keep the current action visible

#### Scenario: Action history scrolling

- **WHEN** there are more actions than fit in the panel
- **THEN** the action history scrolls with a single scrollbar
- **AND** the metrics card and step indicator remain fixed at the top

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

### Requirement: Agent Movement Trails

The system SHALL display a lightweight visual trail showing each agent's last movement between nodes.

#### Scenario: Display movement trail

- **WHEN** an agent's current action targets a different host than their previous action
- **THEN** a thin arrow line is drawn from the previous host to the current host
- **AND** the line color matches the agent (blue for defender, red for attacker)
- **AND** the line has a gradient effect with lower opacity at the origin and higher opacity at the destination
- **AND** an arrow indicator points toward the current host

#### Scenario: Trail line styling

- **WHEN** a movement trail is displayed
- **THEN** the line width is 2-3 pixels
- **AND** the alpha gradient ranges from approximately 0.2 at origin to 0.7 at destination
- **AND** the trail appears behind (z-order) node highlights but above network edges

#### Scenario: No trail on first action

- **WHEN** viewing step 0 or the agent's first appearance
- **THEN** no movement trail is displayed for that agent

#### Scenario: No trail on same-node action

- **WHEN** an agent's current action targets the same host as their previous action
- **THEN** no movement trail is displayed for that agent

#### Scenario: Trail updates on step navigation

- **WHEN** the user navigates to a different step
- **THEN** movement trails update to reflect transitions into that step
- **AND** previous step's trails are replaced (only current transition shown)

#### Scenario: Simultaneous agent trails

- **WHEN** both agents move to different nodes in the same step
- **THEN** both movement trails are displayed simultaneously
- **AND** each trail maintains its agent-specific color

### Requirement: Agent Action Tooltips

The system SHALL display floating tooltip bubbles above nodes showing the current action each agent is taking.

#### Scenario: Display action tooltip on target node

- **WHEN** an agent's action targets a host at the current step
- **THEN** a tooltip bubble is displayed above the target node
- **AND** the tooltip shows the action type (e.g., "ExploitRemoteService", "Restore")
- **AND** the tooltip shows a success (checkmark) or failure (X) indicator
- **AND** the tooltip background color matches the agent (blue for defender, red for attacker)

#### Scenario: Tooltip positioning

- **WHEN** a blue agent's action targets a host
- **THEN** the blue tooltip is positioned above the target node
- **AND** the tooltip is centered horizontally on the node

#### Scenario: Red agent tooltip positioning

- **WHEN** a red agent's action targets a host
- **THEN** the red tooltip is positioned below the target node
- **AND** the tooltip is centered horizontally on the node

#### Scenario: Both agents targeting same node

- **WHEN** both agents target the same host in the current step
- **THEN** both tooltips are displayed without overlap
- **AND** blue remains above the node, red remains below the node

#### Scenario: Tooltip updates on step navigation

- **WHEN** the user navigates to a different step
- **THEN** tooltips update to reflect the new step's actions
- **AND** tooltips move to the new target nodes

### Requirement: Action Success Status Display

The system SHALL display action success/failure status in the action history sidebar.

#### Scenario: Display success indicator

- **WHEN** an action's Status is "TRUE"
- **THEN** a checkmark (✓) indicator is displayed next to the action

#### Scenario: Display failure indicator

- **WHEN** an action's Status is "FALSE"
- **THEN** an X (✗) indicator is displayed next to the action

#### Scenario: Status indicator styling

- **WHEN** displaying success/failure indicators
- **THEN** success indicators are styled in green
- **AND** failure indicators are styled in red/muted color

