import {
  trajectoryV1Schema,
  trajectoryV2Schema,
  type RawV1,
  type RawV2,
} from './schema';
import type {
  Trajectory,
  AgentAction,
  HostInfo,
  SubnetMetadata,
  StepState,
} from './types';

// --- V1 compromise simulation (matches original computeNodeStates logic) ---

const USER_ACCESS_ACTIONS = new Set(['ExploitRemoteService']);
const ROOT_ACCESS_ACTIONS = new Set(['PrivilegeEscalate', 'Impact']);
const RESTORE_ACTIONS = new Set(['Restore']);

const computeStepStates = (
  blueActions: RawV1['blue_actions'],
  redActions: RawV1['red_actions']
): StepState[] => {
  const states: StepState[] = [];
  const compromise: Record<string, 'NONE' | 'USER' | 'PRIVILEGED'> = {
    User0: 'PRIVILEGED',
  };

  for (let step = 0; step < blueActions.length; step++) {
    const red = redActions[step];
    if (red?.Status === 'TRUE' && red.Host !== red.Action) {
      if (USER_ACCESS_ACTIONS.has(red.Action)) compromise[red.Host] = 'USER';
      else if (ROOT_ACCESS_ACTIONS.has(red.Action))
        compromise[red.Host] = 'PRIVILEGED';
    }

    const blue = blueActions[step];
    if (
      blue?.Status === 'TRUE' &&
      RESTORE_ACTIONS.has(blue.Action) &&
      blue.Host !== blue.Action
    ) {
      compromise[blue.Host] = 'NONE';
    }

    states.push({
      step,
      mission_phase: 0,
      host_compromise: { ...compromise },
      rewards: {},
      cumulative_reward: {},
    });
  }

  return states;
};

// --- V1 subnet derivation (matches original extractTopology logic) ---

const getNonLoopbackSubnet = (hostInfo: HostInfo): string | null => {
  for (const iface of hostInfo.Interface) {
    if (
      iface['Interface Name'] !== 'lo' &&
      iface.Subnet.network_address !== '127.0.0.0'
    ) {
      return iface.Subnet.network_address;
    }
  }
  return null;
};

const SUBNET_LABEL_PREFIXES = ['User', 'Enterprise', 'Op'];

const deriveSubnetLabel = (
  networkAddress: string,
  hostnames: string[]
): string => {
  for (const prefix of SUBNET_LABEL_PREFIXES) {
    if (hostnames.some((h) => h.startsWith(prefix))) return prefix;
  }
  return networkAddress;
};

const deriveSubnetMetadata = (
  networkTopology: Record<string, HostInfo>
): Record<string, SubnetMetadata> => {
  const subnetHostMap = new Map<string, string[]>();
  const subnetNetmask = new Map<string, string>();

  for (const [hostname, hostInfo] of Object.entries(networkTopology)) {
    const addr = getNonLoopbackSubnet(hostInfo);
    if (addr) {
      const existing = subnetHostMap.get(addr) ?? [];
      existing.push(hostname);
      subnetHostMap.set(addr, existing);
      if (!subnetNetmask.has(addr)) {
        for (const iface of hostInfo.Interface) {
          if (iface.Subnet.network_address === addr) {
            subnetNetmask.set(addr, iface.Subnet.netmask);
            break;
          }
        }
      }
    }
  }

  const sortedAddrs = [...subnetHostMap.keys()].sort((a, b) => {
    const aIdx = SUBNET_LABEL_PREFIXES.findIndex((p) =>
      (subnetHostMap.get(a) ?? []).some((h) => h.startsWith(p))
    );
    const bIdx = SUBNET_LABEL_PREFIXES.findIndex((p) =>
      (subnetHostMap.get(b) ?? []).some((h) => h.startsWith(p))
    );
    return (
      (aIdx === -1 ? SUBNET_LABEL_PREFIXES.length : aIdx) -
      (bIdx === -1 ? SUBNET_LABEL_PREFIXES.length : bIdx)
    );
  });

  const metadata: Record<string, SubnetMetadata> = {};
  const labels: string[] = [];

  for (const addr of sortedAddrs) {
    const hostnames = subnetHostMap.get(addr) ?? [];
    const label = deriveSubnetLabel(addr, hostnames);
    labels.push(label);
    metadata[label] = {
      label: `Subnet (${label})`,
      network_address: addr,
      netmask: subnetNetmask.get(addr) ?? '255.255.255.0',
      nacl_connections: [],
    };
  }

  // CC2 topology is a linear chain: User ↔ Enterprise ↔ Op
  for (let i = 0; i < labels.length; i++) {
    const connections: string[] = [];
    if (i > 0) connections.push(labels[i - 1]);
    if (i < labels.length - 1) connections.push(labels[i + 1]);
    metadata[labels[i]].nacl_connections = connections;
  }

  return metadata;
};

// --- V1 action conversion ---

const convertV1Actions = (actions: RawV1['blue_actions']): AgentAction[] =>
  actions.map((a, step) => ({
    step,
    Action: a.Action,
    Status: a.Status,
    Host: a.Host,
    Params: {},
  }));

// --- Normalizers ---

const normalizeV1 = (raw: RawV1): Trajectory => ({
  challenge: 'CC2',
  episode: raw.episode,
  experimentTime: raw.experiment_time,
  totalSteps: raw.blue_actions.length,
  blueAgents: [raw.blue_agent_name],
  redAgents: [raw.red_agent_name],
  greenAgents: [],
  networkTopology: raw.network_topology,
  subnetMetadata: deriveSubnetMetadata(raw.network_topology),
  agentActions: {
    [raw.blue_agent_name]: convertV1Actions(raw.blue_actions),
    [raw.red_agent_name]: convertV1Actions(raw.red_actions),
  },
  stepStates: computeStepStates(raw.blue_actions, raw.red_actions),
  metricScores: raw.metric_scores,
  layoutDirection: 'RIGHT',
});

const normalizeV2 = (raw: RawV2): Trajectory => ({
  challenge: raw.challenge,
  episode: raw.episode,
  experimentTime: raw.experiment_time,
  totalSteps: raw.total_steps,
  blueAgents: raw.blue_agents,
  redAgents: raw.red_agents,
  greenAgents: raw.green_agents,
  networkTopology: raw.network_topology,
  subnetMetadata: raw.subnet_metadata,
  agentActions: raw.agent_actions,
  stepStates: raw.step_states,
  metricScores: raw.metric_scores,
  layoutDirection: 'DOWN',
});

export const parseTrajectory = (data: unknown): Trajectory => {
  // Try V2 first (more specific due to format_version discriminant)
  const v2 = trajectoryV2Schema.safeParse(data);
  if (v2.success) return normalizeV2(v2.data);

  const v1 = trajectoryV1Schema.safeParse(data);
  if (v1.success) return normalizeV1(v1.data);

  throw new Error('Invalid trajectory file format');
};
