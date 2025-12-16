## MODIFIED Requirements

### Requirement: Step Navigation

The system SHALL allow navigating within a selected step range using a dual-thumb range slider.

#### Scenario: Display range slider

- **WHEN** viewing the playback controls
- **THEN** a dual-thumb range slider is displayed
- **AND** the left thumb controls the range start
- **AND** the right thumb controls the range end
- **AND** the region between thumbs is visually highlighted
- **AND** the display shows "Steps X - Y / Total" format

#### Scenario: Drag start thumb

- **WHEN** the user drags the left (start) thumb
- **THEN** the range start value updates
- **AND** start is clamped to not exceed end

#### Scenario: Drag end thumb

- **WHEN** the user drags the right (end) thumb
- **THEN** the range end value updates
- **AND** if dragged below start, the range collapses (start moves to match end)

#### Scenario: Drag center region

- **WHEN** the user drags the highlighted center region between thumbs
- **THEN** both start and end shift by the same amount
- **AND** the range width (end - start) remains constant
- **AND** both values are clamped to stay within min/max bounds
- **AND** if bounds are reached, the range stops moving in that direction

#### Scenario: Click on slider track

- **WHEN** the user clicks on the slider track (not a thumb)
- **THEN** the range end is set to the clicked position
- **AND** if clicked before start, the range collapses to that step (start = end = clicked position)

#### Scenario: Step forward

- **WHEN** the user clicks the next step button
- **THEN** the range end increments by 1 (clamped to max)
- **AND** the visualization updates to reflect the new end step's state

#### Scenario: Step backward

- **WHEN** the user clicks the previous step button
- **THEN** the range end decrements by 1 (clamped to start)
- **AND** the visualization updates to reflect the new end step's state

#### Scenario: Jump to first

- **WHEN** the user clicks the first step button
- **THEN** the range end is set to equal start (collapse range)

#### Scenario: Jump to last

- **WHEN** the user clicks the last step button
- **THEN** the range end is set to the last step
