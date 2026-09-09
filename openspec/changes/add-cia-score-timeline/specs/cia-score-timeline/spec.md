## ADDED Requirements

### Requirement: CIA Score Plot Modes

The system SHALL provide cumulative-sum and smoothed-trend modes for plotting confidentiality, integrity, and availability scores when valid CIA metrics are available.

#### Scenario: Display separate CIA plots

- **WHEN** a loaded trajectory contains metric samples with finite C, I, and A values
- **THEN** the bottom timeline displays three distinct plots for C, I, and A side by side
- **AND** each plot displays only its corresponding metric series
- **AND** the chart includes labels or a legend that identifies each series
- **AND** the chart uses styling consistent with the application's cyber-themed slate interface

#### Scenario: Initial cumulative-sum mode

- **WHEN** the CIA plot settings are first displayed
- **THEN** the CIA plot mode defaults to SUM
- **AND** each plotted point at step N represents the sum of that metric from the first sample through step N

#### Scenario: Display smoothed per-step trend

- **GIVEN** the user selects TREND mode
- **WHEN** the CIA plots render
- **THEN** each plotted point represents the trailing average of the per-step metric values through that step
- **AND** the average includes at most the configured number of samples ending at the plotted step
- **AND** early steps average only the samples available up to that step
- **AND** the default trailing-average window is 5 steps

#### Scenario: Adjust trend averaging window

- **GIVEN** TREND mode is selected
- **WHEN** the user changes the averaging window in settings
- **THEN** the configured window is constrained from 1 through the loaded trajectory's sample count
- **AND** all three plots update immediately using the new trailing window

#### Scenario: CIA settings availability

- **WHEN** the loaded trajectory contains valid CIA samples
- **THEN** the application settings include the CIA plot mode control
- **AND** the averaging-window control is visible only in TREND mode
- **WHEN** the loaded trajectory has no valid CIA samples
- **THEN** CIA-specific settings are not displayed

#### Scenario: Follow the selected step

- **WHEN** playback or manual navigation changes the selected trajectory step
- **THEN** each metric line and its shaded area are rendered only from the first sample through the selected step
- **AND** the unreached portion of each plot remains empty while the full episode time axis remains visible
- **AND** each visible line ends with a solid marker at the selected score sample
- **AND** the plots do not display a separate vertical dotted step guide
- **AND** all three endpoints update together without changing the selected plot mode

#### Scenario: Scale plotted values

- **WHEN** plotted CIA values include positive, negative, or constant values in either mode
- **THEN** all three metric plots use the same vertical domain and display matching y-axis ticks
- **AND** the shared domain includes zero and every C, I, and A value revealed through the selected step
- **AND** the shared domain expands or contracts when step navigation changes the visible extrema
- **AND** each vertical axis increases from top to bottom so larger values appear lower
- **AND** all three horizontal domains span the same available CIA samples in step order

### Requirement: Collapsible CIA Timeline Panel

The system SHALL place the CIA score plot in a bottom panel that can be expanded and collapsed without hiding the playback controls.

#### Scenario: Collapse the timeline

- **GIVEN** the CIA timeline is expanded
- **WHEN** the user activates its down toggle
- **THEN** the plot collapses
- **AND** a compact CIA tab with an up toggle remains visible
- **AND** the network visualization expands into the released vertical space

#### Scenario: Expand the timeline

- **GIVEN** the CIA timeline is collapsed
- **WHEN** the user activates its up toggle
- **THEN** the plot expands above the playback controls
- **AND** the network visualization yields enough vertical space for the panel

#### Scenario: Load a trajectory with CIA metrics

- **WHEN** a new trajectory with valid CIA score samples is loaded
- **THEN** the CIA timeline is available in its default expanded state

#### Scenario: Load a trajectory without CIA metrics

- **WHEN** a trajectory has no `metric_scores`, an empty `metric_scores` array, or no samples containing finite C, I, and A values
- **THEN** neither the CIA plot nor its collapsible tab is rendered
- **AND** the rest of the visualization remains usable
