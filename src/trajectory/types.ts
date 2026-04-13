export type AgentAction = {
  step: number;
  Action: string;
  Status: string;
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
  Groups?: Group[];
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
  rewards: Record<string, number>;
  cumulative_reward: Record<string, number>;
};

export type Trajectory = {
  challenge: string;
  episode: number;
  experimentTime: string;
  totalSteps: number;
  blueAgents: string[];
  redAgents: string[];
  greenAgents: string[];
  networkTopology: Record<string, HostInfo>;
  subnetMetadata: Record<string, SubnetMetadata>;
  agentActions: Record<string, AgentAction[]>;
  stepStates: StepState[];
  metricScores: MetricScore[];
  layoutDirection: 'RIGHT' | 'DOWN';
};

export type ActiveAction = {
  agent: string;
  team: 'blue' | 'red';
  Action: string;
  Status: string;
  Host: string;
};
