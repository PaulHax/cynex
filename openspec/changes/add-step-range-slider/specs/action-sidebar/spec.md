## ADDED Requirements

### Requirement: Range-Based Action Highlighting

The system SHALL highlight actions within the selected step range in the action history.

#### Scenario: Highlight steps in range

- **WHEN** a step range [start, end] is selected
- **THEN** all steps from start to end (inclusive) are visually highlighted
- **AND** highlighted steps have a distinct background color

#### Scenario: Current step marker

- **WHEN** viewing the action history with a selected range
- **THEN** the step at range end has an additional current marker (border)
- **AND** the current marker distinguishes it from other highlighted steps

#### Scenario: Click step to set end

- **WHEN** the user clicks a step in the action history
- **AND** the clicked step is >= range start
- **THEN** the range end is set to the clicked step
- **AND** the range start remains unchanged

#### Scenario: Click step before start

- **WHEN** the user clicks a step in the action history
- **AND** the clicked step is < range start
- **THEN** the range collapses to the clicked step (start = end = clicked step)
