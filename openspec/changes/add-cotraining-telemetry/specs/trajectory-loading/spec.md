## ADDED Requirements

### Requirement: V2 Evaluation Telemetry Preservation

The system SHALL preserve supported evaluation telemetry from V2 trajectory files while accepting files that omit optional telemetry.

#### Scenario: Load complete co-training telemetry

- **WHEN** a valid V2 trajectory contains rewards, cumulative rewards, reward breakdowns, and metric scores
- **THEN** all supplied telemetry is available to the visualization at its corresponding step

#### Scenario: Load dynamic resilience roles

- **WHEN** a valid V2 trajectory contains resilience host-role assignments
- **THEN** the assignments are available to topology visualization

#### Scenario: Load trajectory without optional telemetry

- **WHEN** a valid V2 trajectory omits reward breakdowns or has no metric score for a step
- **THEN** the trajectory loads successfully
- **AND** the missing telemetry remains absent rather than being assigned an invented value
