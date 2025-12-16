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

export type LayoutResult = {
  hosts: HostDefinition[];
  subnets: SubnetDefinition[];
  subnetBounds: SubnetBounds[];
  subnetEdges: SubnetEdge[];
};

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

export const computeLayout = async (
  topology: ExtractedTopology
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

  const subnetNodes: ElkNode[] = topology.subnets.map((subnet) => {
    const regularHosts = regularHostsBySubnet.get(subnet.id) ?? [];
    const hasDefender = defenderBySubnet.has(subnet.id);
    const size = computeSubnetSize(regularHosts.length, hasDefender);
    return {
      id: `subnet_${subnet.id}`,
      width: size.width,
      height: size.height,
    };
  });

  const elkEdges: ElkExtendedEdge[] = topology.subnetEdges.map((edge, idx) => ({
    id: `edge_${idx}`,
    sources: [`subnet_${edge.sourceSubnet}`],
    targets: [`subnet_${edge.targetSubnet}`],
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '40',
    },
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
  };
};
