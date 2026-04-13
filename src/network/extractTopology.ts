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

const inferHostType = (hostname: string): HostType => {
  if (hostname === 'Defender') return 'defender';
  if (hostname.endsWith('_router')) return 'router';
  if (
    hostname.includes('_server_host_') ||
    ['Server', 'Database', 'Auth', 'Front', 'Enterprise'].some((p) =>
      hostname.includes(p)
    )
  )
    return 'server';
  return 'workstation';
};

const inferHostRole = (hostname: string): HostRole | undefined => {
  if (hostname.includes('Database')) return 'database';
  if (hostname.includes('Auth')) return 'auth';
  if (hostname.includes('Front')) return 'front';
  return undefined;
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

/** Match hostname to subnet key by longest prefix */
const findSubnetForHost = (
  hostname: string,
  subnetKeys: string[]
): string | undefined => {
  const sorted = [...subnetKeys].sort((a, b) => b.length - a.length);
  return sorted.find((key) => hostname.startsWith(key));
};

export const extractTopology = (
  networkTopology: Record<string, HostInfo>,
  subnetMetadata: Record<string, SubnetMetadata>
): ExtractedTopology => {
  const subnetKeys = Object.keys(subnetMetadata);

  // Build network_address → subnet key lookup for fallback matching
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

  const hosts: HostDefinition[] = Object.keys(networkTopology)
    .filter((hostname) => !hostname.endsWith('_router'))
    .map((hostname) => {
      // Try prefix match first, then fall back to network address
      let subnetKey = findSubnetForHost(hostname, subnetKeys);
      if (!subnetKey) {
        const hostInfo = networkTopology[hostname];
        const addr = getNonLoopbackSubnet(hostInfo);
        if (addr) subnetKey = addrToSubnet.get(addr);
      }
      const type = inferHostType(hostname);
      return {
        id: hostname,
        subnet: subnetKey ?? 'unknown',
        type,
        role: type === 'server' ? inferHostRole(hostname) : undefined,
        x: 0,
        y: 0,
      };
    });

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
