## MODIFIED Requirements
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
