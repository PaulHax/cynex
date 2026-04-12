import type { HostInfo, SubnetMetadata } from '../trajectory/types';

export type HostType = 'workstation' | 'server' | 'defender' | 'router';

export type HostRole = 'database' | 'auth' | 'front';

export type HostDefinition = {
  id: string;
  subnet: string;
  type: HostType;
  role?: HostRole;
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

const SERVER_PATTERNS = ['Server', 'Database', 'Auth', 'Front', 'Enterprise'];

const inferHostRole = (hostname: string): HostRole | undefined => {
  if (hostname.includes('Database')) return 'database';
  if (hostname.includes('Auth')) return 'auth';
  if (hostname.includes('Front')) return 'front';
  return undefined;
};

const inferHostType = (hostname: string): HostType => {
  if (hostname === 'Defender') return 'defender';
  if (SERVER_PATTERNS.some((p) => hostname.includes(p))) return 'server';
  return 'workstation';
};

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

const deriveSubnetLabel = (
  networkAddress: string,
  hostnames: string[]
): string => {
  const prefixes = ['User', 'Enterprise', 'Op'];
  for (const prefix of prefixes) {
    if (hostnames.some((h) => h.startsWith(prefix))) {
      return prefix;
    }
  }
  return networkAddress;
};

const inferHostTypeV2 = (hostname: string): HostType => {
  if (hostname.endsWith('_router')) return 'router';
  if (hostname.includes('_server_host_')) return 'server';
  return 'workstation';
};

const inferHostRoleV2 = (): HostRole | undefined => {
  // CC4 doesn't embed role in hostname like CC2 does
  return undefined;
};

/** Find the subnet key that this hostname belongs to by prefix match */
const findSubnetForHost = (
  hostname: string,
  subnetKeys: string[]
): string | undefined => {
  // Sort by length descending so we match the longest prefix first
  const sorted = [...subnetKeys].sort((a, b) => b.length - a.length);
  return sorted.find((key) => hostname.startsWith(key));
};

export const extractTopologyV2 = (
  networkTopology: Record<string, HostInfo>,
  subnetMetadata: Record<string, SubnetMetadata>
): ExtractedTopology => {
  const subnetKeys = Object.keys(subnetMetadata);

  // Build network_address -> subnet key lookup for fallback matching
  const addrToSubnet = new Map<string, string>();
  for (const key of subnetKeys) {
    addrToSubnet.set(subnetMetadata[key].network_address, key);
  }

  const subnets: SubnetDefinition[] = subnetKeys.map((key) => ({
    id: key,
    label: subnetMetadata[key].label,
    networkAddress: subnetMetadata[key].network_address,
    x: 0,
    width: 0,
  }));

  const hosts: HostDefinition[] = Object.keys(networkTopology).map(
    (hostname) => {
      // Try prefix match first, then fall back to network address match
      let subnetKey = findSubnetForHost(hostname, subnetKeys);
      if (!subnetKey) {
        const hostInfo = networkTopology[hostname];
        const addr = getNonLoopbackSubnet(hostInfo);
        if (addr) subnetKey = addrToSubnet.get(addr);
      }
      const type = inferHostTypeV2(hostname);
      return {
        id: hostname,
        subnet: subnetKey ?? 'unknown',
        type,
        role: type === 'server' ? inferHostRoleV2() : undefined,
        x: 0,
        y: 0,
      };
    }
  );

  // Build edges from NACL connections (deduplicated, undirected)
  const edgeSet = new Set<string>();
  const subnetEdges: SubnetEdge[] = [];
  for (const key of subnetKeys) {
    for (const conn of subnetMetadata[key].nacl_connections) {
      const edgeId = [key, conn].sort().join('|');
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        subnetEdges.push({ sourceSubnet: key, targetSubnet: conn });
      }
    }
  }

  return { hosts, subnets, subnetEdges };
};

export const extractTopology = (
  networkTopology: Record<string, HostInfo>
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

  const SUBNET_ORDER = ['User', 'Enterprise', 'Op'];

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

  const subnets: SubnetDefinition[] = sortedSubnetAddrs.map((addr) => {
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

  const hosts: HostDefinition[] = Object.keys(networkTopology).map(
    (hostname) => {
      const subnetAddr = hostSubnetMap.get(hostname);
      const subnet = subnets.find((s) => s.networkAddress === subnetAddr);
      const type = inferHostType(hostname);
      return {
        id: hostname,
        subnet: subnet?.id ?? 'unknown',
        type,
        role: type === 'server' ? inferHostRole(hostname) : undefined,
        x: 0,
        y: 0,
      };
    }
  );

  const subnetEdges: SubnetEdge[] = [];
  for (let i = 0; i < subnets.length - 1; i++) {
    subnetEdges.push({
      sourceSubnet: subnets[i].id,
      targetSubnet: subnets[i + 1].id,
    });
  }

  return { hosts, subnets, subnetEdges };
};
