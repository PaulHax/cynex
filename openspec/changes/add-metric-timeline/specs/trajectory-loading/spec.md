## ADDED Requirements

### Requirement: Visible File Drop Hint

The trajectory selector SHALL keep the drag-and-drop hint visible directly beneath the Load File button within the sidebar.

#### Scenario: Select or drop a trajectory

- **WHEN** the trajectory dropdown and Load File button are displayed together
- **THEN** the drag-and-drop hint appears immediately below Load File without clipping
- **WHEN** the user drops a valid trajectory JSON file onto the page
- **THEN** the trajectory loads using the existing file-drop workflow
