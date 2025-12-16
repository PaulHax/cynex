# Action Sidebar Spec Delta

## ADDED Requirements

### Requirement: Agent Column Headers

The sidebar SHALL display agent names without emoji icons, using text color to distinguish agents.

#### Scenario: Display agent labels
- **WHEN** the action history sidebar renders
- **THEN** the blue agent label displays "BLUE" in blue text without emoji
- **AND** the red agent label displays "RED" in red text without emoji

### Requirement: Agent Visibility Toggle

Each agent label SHALL have an adjacent visibility toggle button.

#### Scenario: Toggle agent visibility
- **GIVEN** an agent visibility toggle button
- **WHEN** the user clicks the toggle button
- **THEN** the agent's visibility state toggles between visible and hidden
- **AND** the button icon reflects the current visibility state (open eye = visible, closed eye = hidden)

#### Scenario: Visibility affects network graph
- **WHEN** an agent is set to hidden
- **THEN** the network graph SHALL NOT display that agent's trails
- **AND** the network graph SHALL NOT display that agent's action labels
- **AND** the network graph SHALL NOT highlight hosts for that agent's actions
