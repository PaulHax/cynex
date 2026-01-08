# Delta for network-graph

## ADDED Requirements

### Requirement: Host Icons (Role and Type)

The system SHALL render icons as the primary node glyph for hosts.

Host role is distinct from host type. Role icons are an overlay that can appear on top of either server or workstation nodes, but in the default CAGE-style topology most role icons are expected on server-type hosts.

Icon selection rules:
- If a host has a recognized **role** (`database`/`auth`/`front`), the role icon SHALL be rendered.
- Otherwise, the host SHALL render a **type** icon based on host type (`server`/`workstation`/`defender`).

Role → icon mapping:
- `database` → disk icon
- `auth` → security/shield icon
- `front` → front-end / entrypoint icon

Type → icon mapping:
- `server` → server tower icon
- `workstation` → laptop icon
- `defender` → badge icon

For role-typed hosts, the role icon SHALL replace the default node glyph (and any type icon) rather than being embedded within it.

The role icon rendering SHALL preserve these encodings:
- compromise state (via icon color)
- action target highlight (via an outline ring)

#### Scenario: Render role icon for a database host
- **GIVEN** a host with role `database`
- **WHEN** the network topology is rendered
- **THEN** the node displays the disk icon

#### Scenario: Render role icon for an auth host
- **GIVEN** a host with role `auth`
- **WHEN** the network topology is rendered
- **THEN** the node displays the shield icon

#### Scenario: No role icon for unknown roles
- **GIVEN** a host with no recognized role
- **WHEN** the network topology is rendered
- **THEN** the node displays the host-type icon

#### Scenario: Workstation without role uses the laptop icon
- **GIVEN** a workstation host with no recognized role
- **WHEN** the network topology is rendered
- **THEN** the node displays the laptop icon

#### Scenario: Server without role uses the server tower icon
- **GIVEN** a server host with no recognized role
- **WHEN** the network topology is rendered
- **THEN** the node displays the server tower icon

#### Scenario: Defender uses the badge icon
- **GIVEN** a defender host
- **WHEN** the network topology is rendered
- **THEN** the node displays the badge icon

#### Scenario: Icons remain readable across node states
- **GIVEN** a host with an icon
- **WHEN** the host is clean, compromised, or restored
- **THEN** the icon remains visible (sufficient contrast against the background)

### Requirement: Host Tooltip Shows Role

The host tooltip SHALL display the inferred host role when available.

#### Scenario: Tooltip includes role
- **GIVEN** a host with a recognized role
- **WHEN** the user hovers the host
- **THEN** the tooltip displays the role value
