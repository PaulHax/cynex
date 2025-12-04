## MODIFIED Requirements

### Requirement: Trajectory Loading

The system SHALL load trajectory data from JSON files and provide multiple methods for users to select trajectories.

#### Scenario: Application start with no trajectories

- **WHEN** the application starts
- **AND** no trajectory files exist in `public/data/trajectories/`
- **THEN** the app displays a prompt to load a trajectory file

#### Scenario: Application start with available trajectories

- **WHEN** the application starts
- **AND** trajectory files exist in `public/data/trajectories/`
- **THEN** the dropdown shows available trajectories
- **AND** the first trajectory is loaded by default

#### Scenario: Select trajectory from dropdown

- **WHEN** the user selects a trajectory from the dropdown menu
- **THEN** the selected trajectory is loaded
- **AND** the visualization resets to step 0
- **AND** the trajectory metadata is displayed

#### Scenario: Load local file via file picker

- **WHEN** the user clicks the file input button
- **AND** selects a valid trajectory JSON file
- **THEN** the file is parsed and loaded
- **AND** the visualization resets to step 0

#### Scenario: Load file via drag and drop

- **WHEN** the user drags a JSON file over the drop zone
- **THEN** the drop zone highlights to indicate it accepts the file
- **WHEN** the user drops the file
- **THEN** the file is parsed and loaded
- **AND** the visualization resets to step 0

#### Scenario: Invalid file format

- **WHEN** the user attempts to load a file that is not valid trajectory JSON
- **THEN** an error message is displayed
- **AND** the current trajectory remains unchanged
