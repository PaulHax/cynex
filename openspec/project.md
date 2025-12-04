# Project Context

## Purpose

**Cynex** is a static website for visualizing reinforcement learning (RL) agent trajectories in cyber security simulation environments. The visualization shows **red (attacker)** and **blue (defender)** agents operating on a network topology over time.

**Initial target**: CAGE Challenge 2 / CybORG trajectories (~100 steps, 14 hosts). Designed to support other cyber security scenarios in the future.

**Key constraint**: Work with existing JSON trajectory files. No backend required.

## Tech Stack

| Layer           | Technology                                 | Rationale                                                 |
| --------------- | ------------------------------------------ | --------------------------------------------------------- |
| Build           | Vite 7                                     | Fast, static output, excellent DX                         |
| Framework       | React 19                                   | Component model, hooks for state                          |
| Language        | TypeScript 5.9                             | Type safety, better DX                                    |
| Graph Rendering | deck.gl                                    | WebGL performance, extensible layers                      |
| Graph Layout    | graphology + graphology-layout-forceatlas2 | Pre-compute node positions                                |
| Timeline        | Custom React + CSS                         | Simple scrubber, no heavy deps                            |
| Styling         | Tailwind CSS                               | Utility-first, fast iteration                             |
| State           | XState                                     | State machine for playback logic, clear state transitions |
| Linting         | ESLint 9 + typescript-eslint               | Code quality                                              |

## Project Conventions

### Code Style

- Functional programming paradigm preferred
- TypeScript strict mode enabled
- ESLint with recommended rules for TypeScript and React hooks
- No unnecessary comments - code should be self-documenting

### Architecture Patterns

- **State Management**: XState state machines for playback logic (idle → loading → ready/playing/paused)
- **Component Structure**: Presentational components with hooks for data/logic
- **File Organization** (organized by domain, not programming pattern):
  - `src/trajectory/` - Trajectory data types, loading, transforms
  - `src/network/` - Network topology definitions, host positions, colors
  - `src/playback/` - XState state machine for playback control
  - `src/view/` - React components, hooks, deck.gl layers (all view-related)
  - `public/data/trajectories/` - JSON trajectory files

### Testing Strategy

Playwright for end-to-end tests.

### Git Workflow

Small commits with concise messages (single line for small changes).

## Domain Context

### CAGE Challenge 2 Network Topology

Fixed 14-host topology across 3 subnets:

| Subnet     | Hosts                                               |
| ---------- | --------------------------------------------------- |
| User       | User0, User1, User2, User3, User4                   |
| Enterprise | Enterprise0, Enterprise1, Enterprise2, Defender     |
| Op         | Op_Host0, Op_Host1, Op_Host2, Auth, Database, Front |

### Agent Actions

**Blue (Defender) Actions:**

- `Monitor` - Passive monitoring
- `Restore` - Restore compromised host
- `DecoyFemitter`, `DecoyTomcat`, `DecoyVsftpd`, `DecoyHarakaSMPT`, `DecoyApache`, `DecoySvchost` - Deploy decoy services

**Red (Attacker) Actions:**

- `DiscoverRemoteSystems` - Network reconnaissance
- `DiscoverNetworkServices` - Service enumeration
- `ExploitRemoteService` - Exploit vulnerability
- `PrivilegeEscalate` - Escalate privileges on host
- `Impact` - Execute impact on compromised host

### Trajectory JSON Schema

```typescript
type TrajectoryFile = {
  blue_agent_name: string;
  red_agent_name: string;
  episode: number;
  experiment_time: string;
  network_topology: Record<string, HostInfo>;
  blue_actions: AgentAction[]; // one per step
  red_actions: AgentAction[]; // one per step
  metric_scores: MetricScore[]; // C/I/A/Resilience per step
};
```

## Important Constraints

- **Static site only** - no backend, all data from JSON files
- **Pre-bundled or user-uploaded trajectories** - files in `public/data/trajectories/` or drag-drop upload
- **WebGL rendering** - requires modern browser with WebGL support

## External Dependencies

- **Sample trajectories**: Pre-existing JSON files from CAGE Challenge 2 experiments
- **CAGE Challenge 2 documentation**: Network topology and action definitions from https://github.com/ITM-Kitware/cage-challenge-2

## References

- CAGE Challenge 2 repo: https://github.com/ITM-Kitware/cage-challenge-2
- deck.gl docs: https://deck.gl/docs
- XState docs: https://stately.ai/docs/xstate
- Implementation spec: `/home/paulhax/src/itm/cyber/plans/cyborg-trajectory-viz-outline`
