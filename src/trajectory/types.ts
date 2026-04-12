export type AgentAction = {
  Action: string;
  Status: 'TRUE' | 'FALSE';
  Host: string;
};

export type AgentActionV2 = {
  step: number;
  Action: string;
  Status: string; // TRUE, FALSE, UNKNOWN, IN_PROGRESS
  Host: string;
  Params: Record<string, unknown>;
};

export type MetricScore = {
  C: number;
  I: number;
  A: number;
  Resilience: number;
};

export type Subnet = {
  network_address: string;
  netmask: string;
  _prefixlen: number;
};

export type NetworkInterface = {
  'Interface Name': string;
  'IP Address': string;
  Subnet: Subnet;
};

export type Session = {
  Username: string;
  ID: number;
  Timeout: number;
  PID: number;
  Type: string;
  Agent: string;
};

export type Process = {
  PID: number;
  Username: string;
};

export type Group = {
  GID: number;
};

export type UserInfo = {
  Username: string;
  Password?: string;
  Groups: Group[];
};

export type SystemInfo = {
  Hostname: string;
  OSType: 'LINUX' | 'WINDOWS';
  OSDistribution: string;
  OSVersion: string;
  Architecture: string;
};

export type HostInfo = {
  Interface: NetworkInterface[];
  Sessions: Session[];
  Processes: Process[];
  'User Info': UserInfo[];
  'System info': SystemInfo;
};

export type TrajectoryFile = {
  blue_agent_name: string;
  red_agent_name: string;
  episode: number;
  experiment_time: string;
  network_topology: Record<string, HostInfo>;
  blue_actions: AgentAction[];
  red_actions: AgentAction[];
  metric_scores: MetricScore[];
};

export type SubnetMetadata = {
  label: string;
  network_address: string;
  netmask: string;
  nacl_connections: string[];
};

export type StepState = {
  step: number;
  mission_phase: number;
  host_compromise: Record<string, 'NONE' | 'USER' | 'PRIVILEGED'>;
};

export type TrajectoryFileV2 = {
  format_version: '2.0';
  challenge: string;
  episode: number;
  seed: number;
  total_steps: number;
  experiment_time: string;
  blue_agents: string[];
  red_agents: string[];
  green_agents: string[];
  network_topology: Record<string, HostInfo>;
  subnet_metadata: Record<string, SubnetMetadata>;
  agent_actions: Record<string, AgentActionV2[]>;
  step_states: StepState[];
  metric_scores: MetricScore[];
  // Backward-compat flat arrays (interleaved across agents)
  blue_agent_name: string;
  red_agent_name: string;
  blue_actions: AgentActionV2[];
  red_actions: AgentActionV2[];
};

export type AnyTrajectoryFile = TrajectoryFile | TrajectoryFileV2;

export const isV2 = (t: AnyTrajectoryFile): t is TrajectoryFileV2 =>
  'format_version' in t && t.format_version === '2.0';
