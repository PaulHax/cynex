export type AgentAction = {
  Action: string;
  Status: "TRUE" | "FALSE";
  Host: string;
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
  "Interface Name": string;
  "IP Address": string;
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
  OSType: "LINUX" | "WINDOWS";
  OSDistribution: string;
  OSVersion: string;
  Architecture: string;
};

export type HostInfo = {
  Interface: NetworkInterface[];
  Sessions: Session[];
  Processes: Process[];
  "User Info": UserInfo[];
  "System info": SystemInfo;
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
