import type { TrajectoryFile, HostInfo } from "../trajectory/types";

export type HostType = "workstation" | "server" | "defender";

export type HostDefinition = {
  id: string;
  subnet: string;
  type: HostType;
  x: number;
  y: number;
};

export type SubnetDefinition = {
  id: string;
  label: string;
  networkAddress: string;
  x: number;
  width: number;
};

export type SubnetEdge = {
  sourceSubnet: string;
  targetSubnet: string;
};

export type ExtractedTopology = {
  hosts: HostDefinition[];
  subnets: SubnetDefinition[];
  subnetEdges: SubnetEdge[];
};

const SERVER_PATTERNS = ["Server", "Database", "Auth", "Front", "Enterprise"];

const inferHostType = (hostname: string): HostType => {
  if (hostname === "Defender") return "defender";
  if (SERVER_PATTERNS.some((p) => hostname.includes(p))) return "server";
  return "workstation";
};

const getNonLoopbackSubnet = (hostInfo: HostInfo): string | null => {
  for (const iface of hostInfo.Interface) {
    if (iface["Interface Name"] !== "lo" && iface.Subnet.network_address !== "127.0.0.0") {
      return iface.Subnet.network_address;
    }
  }
  return null;
};

const deriveSubnetLabel = (networkAddress: string, hostnames: string[]): string => {
  const prefixes = ["User", "Enterprise", "Op"];
  for (const prefix of prefixes) {
    if (hostnames.some((h) => h.startsWith(prefix))) {
      return prefix;
    }
  }
  return networkAddress;
};

export const extractTopology = (
  networkTopology: TrajectoryFile["network_topology"]
): ExtractedTopology => {
  const subnetHostMap = new Map<string, string[]>();
  const hostSubnetMap = new Map<string, string>();

  for (const [hostname, hostInfo] of Object.entries(networkTopology)) {
    const subnetAddr = getNonLoopbackSubnet(hostInfo);
    if (subnetAddr) {
      hostSubnetMap.set(hostname, subnetAddr);
      const existing = subnetHostMap.get(subnetAddr) ?? [];
      existing.push(hostname);
      subnetHostMap.set(subnetAddr, existing);
    }
  }

  const SUBNET_ORDER = ["User", "Enterprise", "Op"];

  const getSubnetSortKey = (networkAddr: string): number => {
    const hostnames = subnetHostMap.get(networkAddr) ?? [];
    for (const [index, prefix] of SUBNET_ORDER.entries()) {
      if (hostnames.some((h) => h.startsWith(prefix))) {
        return index;
      }
    }
    return SUBNET_ORDER.length;
  };

  const sortedSubnetAddrs = [...subnetHostMap.keys()].sort((a, b) => {
    return getSubnetSortKey(a) - getSubnetSortKey(b);
  });

  const subnets: SubnetDefinition[] = sortedSubnetAddrs.map((addr, _idx) => {
    const hostnames = subnetHostMap.get(addr) ?? [];
    const label = deriveSubnetLabel(addr, hostnames);
    return {
      id: label,
      label: `Subnet (${label})`,
      networkAddress: addr,
      x: 0,
      width: 0,
    };
  });

  const hosts: HostDefinition[] = Object.keys(networkTopology).map((hostname) => {
    const subnetAddr = hostSubnetMap.get(hostname);
    const subnet = subnets.find((s) => s.networkAddress === subnetAddr);
    return {
      id: hostname,
      subnet: subnet?.id ?? "unknown",
      type: inferHostType(hostname),
      x: 0,
      y: 0,
    };
  });

  const subnetEdges: SubnetEdge[] = [];
  for (let i = 0; i < subnets.length - 1; i++) {
    subnetEdges.push({
      sourceSubnet: subnets[i].id,
      targetSubnet: subnets[i + 1].id,
    });
  }

  return { hosts, subnets, subnetEdges };
};
