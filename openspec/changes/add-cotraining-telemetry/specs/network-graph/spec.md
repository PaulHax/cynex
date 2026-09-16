## ADDED Requirements

### Requirement: Dynamic Resilience Role Encoding

The network graph SHALL use trajectory-provided resilience role assignments when identifying AUTH, DB, and WEB hosts.

#### Scenario: Display assigned resilience roles

- **WHEN** a trajectory assigns a resilience role to a host
- **THEN** the host displays the corresponding AUTH, database, or frontend role icon

#### Scenario: Fall back for legacy trajectories

- **WHEN** a trajectory does not provide resilience role assignments
- **THEN** host roles continue to be inferred from legacy hostnames
