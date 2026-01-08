# Delta for graph-layout

## ADDED Requirements

### Requirement: Host Role Classification

The system SHALL infer a host role from the hostname and expose it in the extracted topology so downstream visualization can render role-specific affordances.

Host role is distinct from host type (server/workstation/defender). By default, role classification SHOULD apply to server-named hosts (e.g., "Database", "Auth", "Front"). Workstation hosts typically have no role.

Supported roles:
- `database` (hostname contains "Database")
- `auth` (hostname contains "Auth")
- `front` (hostname contains "Front")

If no role matches, the role SHALL be omitted or set to a neutral default (e.g., `none`).

#### Scenario: Classify a database host
- **GIVEN** a host with hostname containing "Database"
- **WHEN** extracting topology from a trajectory
- **THEN** the host role is `database`

#### Scenario: Classify an auth host
- **GIVEN** a host with hostname containing "Auth"
- **WHEN** extracting topology from a trajectory
- **THEN** the host role is `auth`

#### Scenario: Unrecognized hostname
- **GIVEN** a host whose hostname contains none of the supported role patterns
- **WHEN** extracting topology from a trajectory
- **THEN** the host role is omitted or set to a neutral default

#### Scenario: Workstation host has no role by default
- **GIVEN** a workstation host (e.g., a hostname that does not match server patterns)
- **WHEN** extracting topology from a trajectory
- **THEN** the host role is omitted or set to a neutral default
