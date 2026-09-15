## ADDED Requirements

### Requirement: Metric Timeline Plot

The system SHALL plot available C, I, A, and Resilience metric scores and cumulative Blue reward above the playback slider using the same horizontal step scale.

#### Scenario: Display evaluation metric series

- **WHEN** the loaded trajectory contains metric scores
- **THEN** the playback area displays distinct traces for C, I, A, and Resilience
- **AND** a legend identifies each trace and its value at the selected step
- **AND** the recorded cumulative Blue reward is plotted when available using a separate vertical scale
- **AND** the plot occupies the same horizontal extent as the slider track

#### Scenario: Keep the sidebar height

- **WHEN** the metric plot expands or collapses
- **THEN** only the map height changes
- **AND** the sidebar remains directly above the playback buttons at the same height
- **AND** the metric plot and slider remain directly below the map

#### Scenario: Center the playback step label

- **WHEN** the playback buttons and step label are shown below the sidebar
- **THEN** the step label is centered in the space remaining after the buttons

#### Scenario: Collapse the sidebar

- **WHEN** the sidebar collapses
- **THEN** playback buttons remain available below the slider
- **AND** the plot and slider continue to fill the map column

#### Scenario: Track the selected step

- **WHEN** the selected step changes
- **THEN** the plot marker moves to the matching step position directly above the slider handle
- **AND** the legend values update for that step

#### Scenario: Collapse the plot

- **WHEN** the user activates the chevron disclosure
- **THEN** the plot collapses or expands
- **AND** the metric legend remains visible
- **AND** the playback slider remains available

#### Scenario: No metric scores

- **WHEN** the loaded trajectory has no metric scores
- **THEN** the playback area omits the metric plot and disclosure
- **AND** existing step navigation remains available

#### Scenario: Metric scores stop before playback ends

- **WHEN** the selected step is beyond the available metric scores
- **THEN** the plot marker still aligns with the slider handle on the full playback scale
- **AND** the legend shows unavailable metric values rather than repeating an earlier score
- **AND** available cumulative reward values continue to be plotted
