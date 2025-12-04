export type HostType = "workstation" | "server" | "defender";
export type SubnetId = "User" | "Enterprise" | "Op";

export type HostDefinition = {
  id: string;
  subnet: SubnetId;
  type: HostType;
  x: number;
  y: number;
};

export type SubnetDefinition = {
  id: SubnetId;
  label: string;
  x: number;
  width: number;
};

export type EdgeDefinition = {
  source: string;
  target: string;
  isFirewall?: boolean;
};

export const SUBNETS: SubnetDefinition[] = [
  { id: "User", label: "Subnet 1 (User)", x: 0, width: 200 },
  { id: "Enterprise", label: "Subnet 2 (Enterprise)", x: 280, width: 200 },
  { id: "Op", label: "Subnet 3 (Operational)", x: 560, width: 240 },
];

export const HOSTS: HostDefinition[] = [
  // User Subnet (5 workstations)
  { id: "User0", subnet: "User", type: "workstation", x: 20, y: 300 },
  { id: "User1", subnet: "User", type: "workstation", x: 60, y: 300 },
  { id: "User2", subnet: "User", type: "workstation", x: 100, y: 300 },
  { id: "User3", subnet: "User", type: "workstation", x: 140, y: 300 },
  { id: "User4", subnet: "User", type: "workstation", x: 180, y: 300 },

  // Enterprise Subnet (3 servers + 1 defender workstation)
  { id: "Enterprise0", subnet: "Enterprise", type: "server", x: 300, y: 50 },
  { id: "Enterprise1", subnet: "Enterprise", type: "server", x: 380, y: 50 },
  { id: "Enterprise2", subnet: "Enterprise", type: "server", x: 460, y: 50 },
  { id: "Defender", subnet: "Enterprise", type: "defender", x: 380, y: 300 },

  // Op Subnet (3 workstations + 3 servers)
  { id: "Op_Host0", subnet: "Op", type: "workstation", x: 580, y: 300 },
  { id: "Op_Host1", subnet: "Op", type: "workstation", x: 660, y: 300 },
  { id: "Op_Host2", subnet: "Op", type: "workstation", x: 740, y: 300 },
  { id: "Auth", subnet: "Op", type: "server", x: 620, y: 50 },
  { id: "Database", subnet: "Op", type: "server", x: 700, y: 50 },
  { id: "Front", subnet: "Op", type: "server", x: 780, y: 50 },
];

const ROUTER_Y = 180;
const FIREWALL_Y = 180;

export const INFRASTRUCTURE_NODES = [
  { id: "router_user", x: 100, y: ROUTER_Y, type: "router" as const },
  { id: "firewall_1", x: 240, y: FIREWALL_Y, type: "firewall" as const },
  { id: "router_enterprise", x: 380, y: ROUTER_Y, type: "router" as const },
  { id: "firewall_2", x: 520, y: FIREWALL_Y, type: "firewall" as const },
  { id: "router_op", x: 700, y: ROUTER_Y, type: "router" as const },
];

export const EDGES: EdgeDefinition[] = [
  // User hosts to User router
  { source: "User0", target: "router_user" },
  { source: "User1", target: "router_user" },
  { source: "User2", target: "router_user" },
  { source: "User3", target: "router_user" },
  { source: "User4", target: "router_user" },

  // User router to Firewall 1
  { source: "router_user", target: "firewall_1", isFirewall: true },

  // Firewall 1 to Enterprise router
  { source: "firewall_1", target: "router_enterprise", isFirewall: true },

  // Enterprise hosts to Enterprise router
  { source: "Enterprise0", target: "router_enterprise" },
  { source: "Enterprise1", target: "router_enterprise" },
  { source: "Enterprise2", target: "router_enterprise" },
  { source: "Defender", target: "router_enterprise" },

  // Enterprise router to Firewall 2
  { source: "router_enterprise", target: "firewall_2", isFirewall: true },

  // Firewall 2 to Op router
  { source: "firewall_2", target: "router_op", isFirewall: true },

  // Op hosts to Op router
  { source: "Op_Host0", target: "router_op" },
  { source: "Op_Host1", target: "router_op" },
  { source: "Op_Host2", target: "router_op" },
  { source: "Auth", target: "router_op" },
  { source: "Database", target: "router_op" },
  { source: "Front", target: "router_op" },
];

export const getHostById = (id: string): HostDefinition | undefined =>
  HOSTS.find((h) => h.id === id);

export const getHostsBySubnet = (subnet: SubnetId): HostDefinition[] =>
  HOSTS.filter((h) => h.subnet === subnet);

export const getAllNodePositions = (): Map<string, [number, number]> => {
  const positions = new Map<string, [number, number]>();

  for (const host of HOSTS) {
    positions.set(host.id, [host.x, host.y]);
  }

  for (const infra of INFRASTRUCTURE_NODES) {
    positions.set(infra.id, [infra.x, infra.y]);
  }

  return positions;
};
