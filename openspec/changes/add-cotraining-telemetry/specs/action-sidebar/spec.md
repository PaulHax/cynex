## ADDED Requirements

### Requirement: Combined Evaluation Telemetry

The metrics card SHALL display all evaluation telemetry supplied for the selected trajectory step.

#### Scenario: Display rewards and CIA scores together

- **WHEN** the selected step contains reward data and a C/I/A/Resilience metric score
- **THEN** the metrics card displays step reward and cumulative reward
- **AND** the metrics card displays C, I, A, and Resilience values
- **AND** C, I, A, and composite Resilience are grouped together as secondary detail

#### Scenario: Display reward components

- **WHEN** the selected step contains a reward breakdown
- **THEN** the metrics card directly displays each supplied RIA, LWF, ASF, and action-cost component
- **AND** the reward components appear above the C, I, A, and Resilience values when those values are available

#### Scenario: Display partial telemetry

- **WHEN** the selected step contains only a subset of supported telemetry
- **THEN** the metrics card displays the available measurements
- **AND** it does not display invented values for unavailable measurements
