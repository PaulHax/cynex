import ELK, {
  type ElkNode,
  type ElkExtendedEdge,
} from 'elkjs/lib/elk.bundled.js';
import type {
  ExtractedTopology,
  HostDefinition,
  SubnetDefinition,
  SubnetEdge,
} from './extractTopology';

export type SubnetBounds = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EdgePath = {
  sourceSubnet: string;
  targetSubnet: string;
  points: [number, number][];
};

export type LayoutResult = {
  hosts: HostDefinition[];
  subnets: SubnetDefinition[];
  subnetBounds: SubnetBounds[];
  subnetEdges: SubnetEdge[];
  edgePaths: EdgePath[];
};

export type LayoutDirection = 'RIGHT' | 'DOWN';

const NODE_WIDTH = 30;
const NODE_HEIGHT = 30;
const NODE_SPACING = 50;
const PADDING = { top: 40, right: 30, bottom: 20, left: 30 };

const computeSquareColumns = (nodeCount: number): number => {
  if (nodeCount <= 1) return 1;
  return Math.ceil(Math.sqrt(nodeCount));
};

const computeCenteredGrid = (
  nodeCount: number,
  subnetX: number,
  subnetY: number,
  subnetWidth: number
): { x: number; y: number }[] => {
  const positions: { x: number; y: number }[] = [];
  const cols = computeSquareColumns(nodeCount);
  const rows = Math.ceil(nodeCount / cols);
  const startY = subnetY + PADDING.top;
  const availableWidth = subnetWidth - PADDING.left - PADDING.right;

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    const nodesInRow = row < rows - 1 ? cols : nodeCount - row * cols;
    const rowWidth = nodesInRow * NODE_WIDTH + (nodesInRow - 1) * NODE_SPACING;
    const rowStartX =
      subnetX + PADDING.left + (availableWidth - rowWidth) / 2 + NODE_WIDTH / 2;

    positions.push({
      x: rowStartX + colInRow * (NODE_WIDTH + NODE_SPACING),
      y: startY + row * (NODE_HEIGHT + NODE_SPACING),
    });
  }

  return positions;
};

const computeDefenderPosition = (
  subnetX: number,
  subnetY: number,
  subnetWidth: number,
  subnetHeight: number
): { x: number; y: number } => {
  const availableWidth = subnetWidth - PADDING.left - PADDING.right;
  const singleNodeRowWidth = NODE_WIDTH;
  const x =
    subnetX +
    PADDING.left +
    (availableWidth - singleNodeRowWidth) / 2 +
    NODE_WIDTH / 2;
  const y = subnetY + subnetHeight - PADDING.bottom - NODE_HEIGHT / 2;
  return { x, y };
};

const computeSubnetSize = (
  nodeCount: number,
  hasDefenderRow: boolean
): { width: number; height: number } => {
  if (nodeCount === 0 && !hasDefenderRow) {
    // Empty subnet (e.g., Internet) -- small labeled box
    return {
      width: PADDING.left + PADDING.right,
      height: PADDING.top + PADDING.bottom,
    };
  }
  const cols = computeSquareColumns(nodeCount);
  const rows = Math.ceil(nodeCount / cols);
  const contentWidth = cols * NODE_WIDTH + (cols - 1) * NODE_SPACING;
  const contentHeight = rows * NODE_HEIGHT + (rows - 1) * NODE_SPACING;
  const defenderRowHeight = hasDefenderRow ? NODE_HEIGHT + NODE_SPACING : 0;

  return {
    width: contentWidth + PADDING.left + PADDING.right,
    height: contentHeight + PADDING.top + PADDING.bottom + defenderRowHeight,
  };
};

/** BFS from the most-connected subnet to assign tier levels */
const computeSubnetTiers = (
  subnetEdges: SubnetEdge[],
  subnetIds: string[]
): Map<string, number> => {
  const adj = new Map<string, Set<string>>();
  for (const id of subnetIds) adj.set(id, new Set());
  for (const edge of subnetEdges) {
    adj.get(edge.sourceSubnet)?.add(edge.targetSubnet);
    adj.get(edge.targetSubnet)?.add(edge.sourceSubnet);
  }

  // Root = most-connected node (Internet in CC4)
  let root = subnetIds[0];
  let maxDeg = 0;
  for (const [id, neighbors] of adj) {
    if (neighbors.size > maxDeg) {
      maxDeg = neighbors.size;
      root = id;
    }
  }

  const tiers = new Map<string, number>();
  const queue = [root];
  tiers.set(root, 0);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const tier = tiers.get(current)!;
    for (const neighbor of adj.get(current) ?? []) {
      if (!tiers.has(neighbor)) {
        tiers.set(neighbor, tier + 1);
        queue.push(neighbor);
      }
    }
  }

  return tiers;
};

/**
 * Sort subnets so children align under their parents across tiers.
 * Within the same tier and same parent group, sort alphabetically
 * which naturally groups "zone_a"/"zone_b" pairs together.
 */
const sortSubnetsForLayout = (
  subnetIds: string[],
  tiers: Map<string, number>,
  subnetEdges: SubnetEdge[]
): string[] => {
  const adj = new Map<string, Set<string>>();
  for (const id of subnetIds) adj.set(id, new Set());
  for (const edge of subnetEdges) {
    adj.get(edge.sourceSubnet)?.add(edge.targetSubnet);
    adj.get(edge.targetSubnet)?.add(edge.sourceSubnet);
  }

  const maxTier = Math.max(...tiers.values());
  const tierGroups: string[][] = Array.from({ length: maxTier + 1 }, () => []);
  for (const id of subnetIds) {
    tierGroups[tiers.get(id) ?? 0].push(id);
  }

  // Tier 0 stays as-is (usually just the root)
  const result: string[] = [...tierGroups[0]];

  for (let t = 1; t <= maxTier; t++) {
    // Build position index for the previous tier
    const prevOrder = new Map<string, number>();
    let idx = 0;
    for (const id of result) {
      if (tiers.get(id) === t - 1) prevOrder.set(id, idx++);
    }

    tierGroups[t].sort((a, b) => {
      const aParents = [...(adj.get(a) ?? [])].filter(
        (n) => tiers.get(n) === t - 1
      );
      const bParents = [...(adj.get(b) ?? [])].filter(
        (n) => tiers.get(n) === t - 1
      );
      const aMin = Math.min(
        ...aParents.map((p) => prevOrder.get(p) ?? Infinity)
      );
      const bMin = Math.min(
        ...bParents.map((p) => prevOrder.get(p) ?? Infinity)
      );
      if (aMin !== bMin) return aMin - bMin;
      return a.localeCompare(b);
    });

    result.push(...tierGroups[t]);
  }

  return result;
};

export const computeLayout = async (
  topology: ExtractedTopology,
  direction: LayoutDirection = 'RIGHT'
): Promise<LayoutResult> => {
  const elk = new ELK();

  const regularHostsBySubnet: Map<string, HostDefinition[]> = new Map();
  const defenderBySubnet: Map<string, HostDefinition> = new Map();

  for (const subnet of topology.subnets) {
    regularHostsBySubnet.set(subnet.id, []);
  }

  for (const host of topology.hosts) {
    if (host.type === 'defender') {
      defenderBySubnet.set(host.subnet, host);
    } else {
      const hosts = regularHostsBySubnet.get(host.subnet);
      if (hosts) {
        hosts.push(host);
      }
    }
  }

  // For DOWN direction, compute tier partitions and sort for grouping
  const subnetIds = topology.subnets.map((s) => s.id);
  const tiers =
    direction === 'DOWN'
      ? computeSubnetTiers(topology.subnetEdges, subnetIds)
      : null;

  const sortedOrder = tiers
    ? sortSubnetsForLayout(subnetIds, tiers, topology.subnetEdges)
    : subnetIds;

  const makeSubnetNode = (subnetId: string): ElkNode => {
    const regularHosts = regularHostsBySubnet.get(subnetId) ?? [];
    const hasDefender = defenderBySubnet.has(subnetId);
    const size = computeSubnetSize(regularHosts.length, hasDefender);
    const node: ElkNode = {
      id: `subnet_${subnetId}`,
      width: size.width,
      height: size.height,
    };
    if (tiers) {
      node.layoutOptions = {
        'elk.partitioning.partition': String(tiers.get(subnetId) ?? 0),
      };
    }
    return node;
  };

  // Build ELK children in sorted order so forceNodeModelOrder keeps grouping
  const subnetNodes: ElkNode[] = sortedOrder.map(makeSubnetNode);

  const elkEdges: ElkExtendedEdge[] = topology.subnetEdges.map((edge, idx) => ({
    id: `edge_${idx}`,
    sources: [`subnet_${edge.sourceSubnet}`],
    targets: [`subnet_${edge.targetSubnet}`],
  }));

  const layoutOptions: Record<string, string> = {
    'elk.algorithm': 'layered',
    'elk.direction': direction,
    'elk.spacing.nodeNode': '40',
    'elk.layered.spacing.nodeNodeBetweenLayers': '60',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
    'elk.layered.spacing.edgeNodeBetweenLayers': '20',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  };

  if (tiers) {
    layoutOptions['elk.partitioning.activate'] = 'true';
    layoutOptions['elk.layered.crossingMinimization.forceNodeModelOrder'] =
      'true';
  }

  const graph: ElkNode = {
    id: 'root',
    layoutOptions,
    children: subnetNodes,
    edges: elkEdges,
  };

  const layoutedGraph = await elk.layout(graph);

  const subnetBoundsMap = new Map<string, SubnetBounds>();
  for (const node of layoutedGraph.children ?? []) {
    if (node.id.startsWith('subnet_')) {
      const subnetId = node.id.replace('subnet_', '');
      subnetBoundsMap.set(subnetId, {
        id: subnetId,
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: node.width ?? 200,
        height: node.height ?? 200,
      });
    }
  }

  // Extract ELK-routed edge paths
  const edgeSourceTargetMap = new Map<
    string,
    { source: string; target: string }
  >();
  for (const edge of topology.subnetEdges) {
    // Find the matching ELK edge
    for (const elkEdge of elkEdges) {
      if (
        elkEdge.sources[0] === `subnet_${edge.sourceSubnet}` &&
        elkEdge.targets[0] === `subnet_${edge.targetSubnet}`
      ) {
        edgeSourceTargetMap.set(elkEdge.id, {
          source: edge.sourceSubnet,
          target: edge.targetSubnet,
        });
      }
    }
  }

  const edgePaths: EdgePath[] = [];
  for (const edge of layoutedGraph.edges ?? []) {
    const meta = edgeSourceTargetMap.get(edge.id);
    if (!meta) continue;
    for (const section of edge.sections ?? []) {
      const points: [number, number][] = [];
      points.push([section.startPoint.x, section.startPoint.y]);
      for (const bp of section.bendPoints ?? []) {
        points.push([bp.x, bp.y]);
      }
      points.push([section.endPoint.x, section.endPoint.y]);
      edgePaths.push({
        sourceSubnet: meta.source,
        targetSubnet: meta.target,
        points,
      });
    }
  }

  const nodePositions = new Map<string, { x: number; y: number }>();
  for (const subnet of topology.subnets) {
    const bounds = subnetBoundsMap.get(subnet.id);
    if (!bounds) continue;

    const regularHosts = regularHostsBySubnet.get(subnet.id) ?? [];
    const positions = computeCenteredGrid(
      regularHosts.length,
      bounds.x,
      bounds.y,
      bounds.width
    );

    regularHosts.forEach((host, idx) => {
      if (positions[idx]) {
        nodePositions.set(host.id, positions[idx]);
      }
    });

    const defender = defenderBySubnet.get(subnet.id);
    if (defender) {
      const defenderPos = computeDefenderPosition(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      );
      nodePositions.set(defender.id, defenderPos);
    }
  }

  const hosts = topology.hosts.map((host) => {
    const pos = nodePositions.get(host.id);
    return {
      ...host,
      x: pos?.x ?? 0,
      y: pos?.y ?? 0,
    };
  });

  const subnets = topology.subnets.map((subnet) => {
    const bounds = subnetBoundsMap.get(subnet.id);
    return {
      ...subnet,
      x: bounds?.x ?? 0,
      width: bounds?.width ?? 200,
    };
  });

  const subnetBounds = topology.subnets.map((subnet) => {
    const bounds = subnetBoundsMap.get(subnet.id);
    return {
      id: subnet.id,
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0,
      width: bounds?.width ?? 200,
      height: bounds?.height ?? 200,
    };
  });

  return {
    hosts,
    subnets,
    subnetBounds,
    subnetEdges: topology.subnetEdges,
    edgePaths,
  };
};
