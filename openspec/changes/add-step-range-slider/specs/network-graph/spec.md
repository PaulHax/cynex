## ADDED Requirements

### Requirement: Accumulated Movement Trails

The system SHALL display agent movement trails for all movements within the selected step range.

#### Scenario: Render trail for each movement in range

- **WHEN** a step range [start, end] is selected
- **AND** agents moved between hosts within that range
- **THEN** a trail segment is rendered for each movement
- **AND** each trail uses the agent's color (blue/red)
- **AND** each trail uses the existing gradient effect (faint at origin, solid at destination)

#### Scenario: Multiple trails displayed

- **WHEN** multiple movements occurred in the range
- **THEN** all trail segments are visible simultaneously
- **AND** trails may overlap if agents visited the same paths

#### Scenario: Empty range trails

- **WHEN** no agent movements occurred in the selected range
- **THEN** no trails are displayed

#### Scenario: Node state at range end

- **WHEN** a step range is selected
- **THEN** node compromise states reflect the cumulative state at range end
- **AND** action labels show actions at range end
