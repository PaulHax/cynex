# Cynex

A cybersecurity simulation visualizer for analyzing red team vs. blue team scenarios on network topologies.

## Features

- **Network Topology Visualization**: Interactive 2D view of a multi-subnet network (User, Enterprise, and Operational subnets) using deck.gl
- **Attack/Defense Playback**: Step through simulated attack and defense trajectories chronologically
- **Node State Tracking**: Color-coded host states showing clean, compromised (user/root access), and restored nodes
- **Action History**: View red team attacks (ExploitRemoteService, PrivilegeEscalate, Impact) and blue team defenses (Restore)
- **Security Metrics Dashboard**: Track CIA (Confidentiality, Integrity, Availability) and Resilience scores

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Loading Trajectory Files

Trajectory JSON files can be loaded two ways:

### Via Manifest (Pre-configured)

Place trajectory files in `public/data/trajectories/` and create a `manifest.json`:

```json
{
  "files": [
    "/data/trajectories/scenario1.json",
    "/data/trajectories/scenario2.json"
  ]
}
```

### Via File Upload

Use the file picker in the UI to load a trajectory JSON directly from your filesystem.

### Trajectory File Format

```json
{
  "blue_agent_name": "BlueAgent",
  "red_agent_name": "RedAgent",
  "episode": 1,
  "experiment_time": "2024-01-01T00:00:00",
  "network_topology": { ... },
  "blue_actions": [{ "Action": "Restore", "Status": "TRUE", "Host": "server1" }],
  "red_actions": [{ "Action": "ExploitRemoteService", "Status": "TRUE", "Host": "workstation1" }],
  "metric_scores": [{ "C": 1.0, "I": 1.0, "A": 1.0, "Resilience": 0.95 }]
}
```

## Tech Stack

- React 19
- TypeScript
- Vite
- deck.gl
- Tailwind CSS
