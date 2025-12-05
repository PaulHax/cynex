## MODIFIED Requirements

### Requirement: Action Panel

The system SHALL display the current step's actions in a side panel with a reorganized layout showing metrics, current step, and action history.

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
