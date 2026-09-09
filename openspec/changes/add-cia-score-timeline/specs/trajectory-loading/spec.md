## ADDED Requirements

### Requirement: Optional CIA Metrics

The system SHALL load otherwise valid trajectory files whether or not they contain CIA metric samples.

#### Scenario: Load trajectory without metric scores

- **WHEN** an otherwise valid trajectory omits `metric_scores`
- **THEN** the trajectory loads successfully
- **AND** its normalized metric score collection is empty

#### Scenario: Load trajectory with empty metric scores

- **WHEN** an otherwise valid trajectory contains an empty `metric_scores` array
- **THEN** the trajectory loads successfully
- **AND** features unrelated to CIA metrics remain available
