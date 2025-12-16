# Network Graph Spec Delta

## ADDED Requirements

### Requirement: Agent Visibility Filtering

The network graph SHALL respect agent visibility settings when rendering agent-specific elements.

#### Scenario: Filter trails by visibility
- **GIVEN** an agent visibility state
- **WHEN** rendering agent movement trails
- **THEN** only trails for visible agents SHALL be rendered

#### Scenario: Filter action labels by visibility
- **GIVEN** an agent visibility state
- **WHEN** rendering action label overlays
- **THEN** only action labels for visible agents SHALL be displayed

#### Scenario: Filter host highlights by visibility
- **GIVEN** an agent visibility state
- **WHEN** computing host highlight colors
- **THEN** only visible agent actions SHALL contribute to host highlighting
