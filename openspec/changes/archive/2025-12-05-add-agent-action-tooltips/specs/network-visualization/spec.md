## ADDED Requirements
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
