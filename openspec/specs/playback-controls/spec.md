# playback-controls Specification

## Purpose

Provide controls for navigating between trajectory steps.

## Requirements

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
