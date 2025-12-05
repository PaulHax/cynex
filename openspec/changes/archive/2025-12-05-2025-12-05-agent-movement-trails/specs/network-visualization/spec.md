# network-visualization Spec Delta

## ADDED Requirements

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
