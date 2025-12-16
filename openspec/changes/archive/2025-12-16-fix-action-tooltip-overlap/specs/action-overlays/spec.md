## MODIFIED Requirements

### Requirement: Agent Action Tooltips

The system SHALL display floating tooltip bubbles above nodes showing the current action each agent is taking, with dynamic collision detection to prevent overlaps.

#### Scenario: Display action tooltip on target node

- **WHEN** an agent's action targets a host at the current step
- **THEN** a tooltip bubble is displayed above the target node
- **AND** the tooltip shows the action type (e.g., "ExploitRemoteService", "Restore")
- **AND** the tooltip shows a success (checkmark) or failure (X) indicator
- **AND** the tooltip background color matches the agent (blue for defender, red for attacker)

#### Scenario: Tooltip positioning

- **WHEN** an agent's action targets a host
- **THEN** the tooltip is positioned above the target node
- **AND** the tooltip is initially centered horizontally on the node

#### Scenario: Collision detection and nudging

- **WHEN** two tooltips would overlap in screen space
- **THEN** the system calculates bounding boxes for all visible tooltips
- **AND** both overlapping tooltips are nudged symmetrically apart (one left, one right)
- **AND** nudging is recalculated on zoom or pan changes

#### Scenario: Both agents targeting same node

- **WHEN** both agents target the same host in the current step
- **THEN** both tooltips are displayed above the node
- **AND** the collision detection nudges them apart horizontally

#### Scenario: Tooltip updates on step navigation

- **WHEN** the user navigates to a different step
- **THEN** tooltips update to reflect the new step's actions
- **AND** tooltips move to the new target nodes
- **AND** collision detection recalculates positions
