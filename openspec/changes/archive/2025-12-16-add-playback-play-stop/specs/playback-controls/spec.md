## ADDED Requirements

### Requirement: Auto-Playback

The system SHALL support automatic step advancement with play/stop controls.

#### Scenario: Start playback

- **WHEN** the user clicks the play button
- **AND** the current step is not the last step
- **THEN** steps SHALL advance automatically every 1 second
- **AND** the play button SHALL change to a stop button

#### Scenario: Stop playback

- **WHEN** the user clicks the stop button during playback
- **THEN** automatic step advancement SHALL stop
- **AND** the stop button SHALL change to a play button

#### Scenario: Playback reaches end

- **WHEN** auto-playback is active
- **AND** the current step reaches the last step
- **THEN** auto-playback SHALL stop automatically
- **AND** the stop button SHALL change to a play button
