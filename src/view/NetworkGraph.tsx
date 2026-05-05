import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import { OrthographicView, type PickingInfo } from '@deck.gl/core';
import {
  ScatterplotLayer,
  PolygonLayer,
  PathLayer,
  TextLayer,
  IconLayer,
} from '@deck.gl/layers';
import type {
  LayoutResult,
  SubnetBounds,
  EdgePath,
} from '../network/computeLayout';
import {
  HOST_TYPE_COLORS,
  AGENT_COLORS,
  EDGE_COLORS,
  NODE_STATE_COLORS,
  getSubnetColor,
  type RGBColor,
} from '../network/colors';
import type { ActiveAction } from '../trajectory/types';
import type { NodeState } from '../trajectory/nodeState';
import type { StepRange } from './RangeSlider';
import type { AgentVisibility } from '../App';
import type { Movement } from '../trajectory/computeTrails';

import hostIconAtlas from '../assets/host-role-atlas.svg';
import type { HostRole } from '../network/extractTopology';

type NetworkGraphProps = {
  activeActions: ActiveAction[];
  greenActiveHosts: Map<string, boolean>;
  movements: Movement[];
  stepRange: StepRange;
  nodeStates?: Map<string, NodeState>;
  topology: LayoutResult | null;
  agentVisibility: AgentVisibility;
};

type TrailData = {
  path: [number, number][];
  color: [number, number, number, number][];
};

type NodeData = {
  id: string;
  type: string;
  role?: HostRole;
  subnet?: string;
  position: [number, number];
  radius: number;
  color: RGBColor;
};

type RoleNodeData = NodeData & { role: HostRole };
type TypeIconNodeData = NodeData & {
  type: 'server' | 'workstation' | 'defender';
  role?: undefined;
};

const Z_INDEX = {
  ACTION_LABEL: 10,
  HOST_TOOLTIP: 20,
};

const getNodeRadius = (type: string): number => {
  switch (type) {
    case 'server':
      return 16;
    case 'defender':
      return 16;
    default:
      return 14;
  }
};

const HOST_ICON_SIZE = 72;

type HostIconKey = HostRole | 'server' | 'workstation' | 'defender';

const HOST_ICON_MAPPING: Record<
  HostIconKey,
  {
    x: number;
    y: number;
    width: number;
    height: number;
    anchorX: number;
    anchorY: number;
    mask: boolean;
  }
> = {
  database: {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16,
    mask: true,
  },
  auth: {
    x: 32,
    y: 0,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16,
    mask: true,
  },
  // The gate glyph is visually bottom-heavy; tweak anchorY to center it.
  front: {
    x: 64,
    y: 0,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 18,
    mask: true,
  },

  server: {
    x: 96,
    y: 0,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16,
    mask: true,
  },
  workstation: {
    x: 128,
    y: 0,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16,
    mask: true,
  },
  defender: {
    x: 160,
    y: 0,
    width: 32,
    height: 32,
    anchorX: 16,
    anchorY: 16,
    mask: true,
  },
};

const GREEN_STATUS_ATLAS =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16">' +
      '<polyline points="3,8 6.5,12 13,4" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<line x1="19" y1="3" x2="29" y2="13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="29" y1="3" x2="19" y2="13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>'
  );

const GREEN_STATUS_MAPPING = {
  check: {
    x: 0,
    y: 0,
    width: 16,
    height: 16,
    anchorX: 8,
    anchorY: 8,
    mask: true,
  },
  cross: {
    x: 16,
    y: 0,
    width: 16,
    height: 16,
    anchorX: 8,
    anchorY: 8,
    mask: true,
  },
};

const hasHostRole = (node: NodeData): node is RoleNodeData =>
  node.role !== undefined;

const hasHostTypeIcon = (node: NodeData): node is TypeIconNodeData =>
  node.role === undefined &&
  (node.type === 'server' ||
    node.type === 'workstation' ||
    node.type === 'defender');

const hasHostIcon = (node: NodeData): node is RoleNodeData | TypeIconNodeData =>
  hasHostRole(node) || hasHostTypeIcon(node);

const getHostIconKey = (node: RoleNodeData | TypeIconNodeData): HostIconKey =>
  hasHostRole(node) ? node.role : node.type;

const AGED_COLORS: Record<'blue' | 'red', RGBColor> = {
  blue: [115, 140, 170], // muted blue
  red: [165, 105, 100], // muted red
};

const lerpColor = (
  from: RGBColor,
  to: RGBColor,
  t: number
): [number, number, number] => [
  Math.round(from[0] + (to[0] - from[0]) * t),
  Math.round(from[1] + (to[1] - from[1]) * t),
  Math.round(from[2] + (to[2] - from[2]) * t),
];

const createTrailPath = (
  movement: Movement,
  nodePositions: Map<string, [number, number]>,
  zoom: number,
  ageFactor: number
): TrailData | null => {
  const fromPos = nodePositions.get(movement.fromHost);
  const toPos = nodePositions.get(movement.toHost);
  if (!fromPos || !toPos) return null;

  const freshColor = AGENT_COLORS[movement.team];
  const agedColor = AGED_COLORS[movement.team];
  const baseColor = lerpColor(agedColor, freshColor, ageFactor);

  const dx = toPos[0] - fromPos[0];
  const dy = toPos[1] - fromPos[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const pixelGap = 20;
  const scale = Math.pow(2, zoom);
  const worldGap = pixelGap / scale;

  const edgeStart: [number, number] = [
    fromPos[0] + ux * worldGap,
    fromPos[1] + uy * worldGap,
  ];
  const edgeEnd: [number, number] = [
    toPos[0] - ux * worldGap,
    toPos[1] - uy * worldGap,
  ];

  const segments = 10;
  const path: [number, number][] = [];
  const colors: [number, number, number, number][] = [];

  const minAlpha = 30 + 70 * ageFactor;
  const maxAlpha = 100 + 155 * ageFactor;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    path.push([
      edgeStart[0] + (edgeEnd[0] - edgeStart[0]) * t,
      edgeStart[1] + (edgeEnd[1] - edgeStart[1]) * t,
    ]);
    const alpha = Math.round(minAlpha + (maxAlpha - minAlpha) * t);
    colors.push([baseColor[0], baseColor[1], baseColor[2], alpha]);
  }

  return { path, color: colors };
};

const shortAgentName = (name: string): string => {
  const match = name.match(/^(blue|red)_agent_(\d+)$/);
  if (match) return `${match[1][0].toUpperCase()}${match[2]}`;
  return name;
};

const TEAM_COLORS: Record<'blue' | 'red', string> = {
  blue: '#60a5fa',
  red: '#f87171',
};

const ActionLabel = ({
  active,
  position,
}: {
  active: ActiveAction;
  position: { x: number; y: number };
}) => {
  const statusIcon = active.Status === 'TRUE' ? '✓' : '✗';
  const statusColor = active.Status === 'TRUE' ? '#4ade80' : '#94a3b8';
  const color = TEAM_COLORS[active.team];
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        border: `1px solid ${color}`,
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: Z_INDEX.ACTION_LABEL,
      }}
    >
      <span style={{ color: statusColor }}>{statusIcon}</span>
      <span style={{ color, fontSize: '11px' }}>
        {shortAgentName(active.agent)}
      </span>
      <span style={{ color: '#e2e8f0', opacity: active.inProgress ? 0.6 : 1 }}>
        {active.Action}
        {active.inProgress && '\u2026'}
      </span>
    </div>
  );
};

const HostTooltip = ({
  node,
  x,
  y,
}: {
  node: NodeData;
  x: number;
  y: number;
}) => (
  <div
    data-testid="host-tooltip"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: 'translate(10px, 10px)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      pointerEvents: 'none',
      zIndex: Z_INDEX.HOST_TOOLTIP,
    }}
  >
    <div>{node.id}</div>
    <div>Type: {node.type}</div>
    {node.role && <div>Role: {node.role}</div>}
    {node.subnet && <div>Subnet: {node.subnet}</div>}
  </div>
);

export const NetworkGraph = ({
  activeActions,
  greenActiveHosts,
  movements: allMovements,
  stepRange,
  nodeStates,
  topology,
  agentVisibility,
}: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [userViewState, setUserViewState] = useState<{
    viewState: { target: [number, number, number]; zoom: number };
    forTopology: LayoutResult | null;
  } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: NodeData;
    x: number;
    y: number;
  } | null>(null);

  // Filter active actions by visibility
  const visibleActions = activeActions.filter((a) => agentVisibility[a.team]);

  // Collect all hosts being targeted for highlight rings
  const activeHosts = new Map<string, 'blue' | 'red'>();
  for (const a of visibleActions) {
    if (a.Host) activeHosts.set(a.Host, a.team);
  }

  const onHover = useCallback((info: PickingInfo<NodeData>) => {
    if (info.object && info.x !== undefined && info.y !== undefined) {
      setHoveredNode({ node: info.object, x: info.x, y: info.y });
    } else {
      setHoveredNode(null);
    }
  }, []);

  const onViewStateChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ viewState }: { viewState: any }) =>
      setUserViewState({ viewState, forTopology: topology }),
    [topology]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const initialViewState = useMemo(() => {
    if (!topology || !containerSize) return null;

    const bounds = topology.subnetBounds;
    if (bounds.length === 0) return null;

    const minX = Math.min(...bounds.map((b) => b.x));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padding = 40;
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;

    const scale = Math.min(
      availableWidth / boundsWidth,
      availableHeight / boundsHeight
    );
    const zoom = Math.log2(scale);

    return {
      target: [centerX, centerY, 0] as [number, number, number],
      zoom,
    };
  }, [topology, containerSize]);

  const viewState =
    userViewState?.forTopology === topology
      ? userViewState.viewState
      : initialViewState;

  const {
    nodePositions,
    subnetPolygons,
    subnetLabels,
    allNodes,
    connectionPaths,
  } = useMemo(() => {
    if (!topology) {
      return {
        nodePositions: new Map<string, [number, number]>(),
        subnetPolygons: [],
        subnetLabels: [],
        allNodes: [],
        connectionPaths: [],
      };
    }

    const positions = new Map<string, [number, number]>();
    for (const host of topology.hosts) {
      positions.set(host.id, [host.x, host.y]);
    }

    const boundsMap = new Map<string, SubnetBounds>();
    for (const bounds of topology.subnetBounds) {
      boundsMap.set(bounds.id, bounds);
    }

    const polygons = topology.subnetBounds.map((bounds, idx) => ({
      id: bounds.id,
      polygon: [
        [bounds.x, bounds.y],
        [bounds.x + bounds.width, bounds.y],
        [bounds.x + bounds.width, bounds.y + bounds.height],
        [bounds.x, bounds.y + bounds.height],
      ],
      color: getSubnetColor(idx),
    }));

    const subnetLabelMap = new Map(
      topology.subnets.map((s) => [s.id, s.label])
    );

    const labels = topology.subnetBounds.map((bounds, idx) => ({
      id: bounds.id,
      text: subnetLabelMap.get(bounds.id) ?? bounds.id,
      position: [bounds.x, bounds.y] as [number, number],
      color: getSubnetColor(idx),
    }));

    const hostNodes = topology.hosts.map((host) => ({
      ...host,
      position: [host.x, host.y] as [number, number],
      radius: getNodeRadius(host.type),
      color: (host.type === 'defender'
        ? AGENT_COLORS.blue
        : host.type === 'workstation'
          ? HOST_TYPE_COLORS.server
          : HOST_TYPE_COLORS[host.type]) as RGBColor,
    }));

    // Use ELK-routed edge paths if available, fall back to straight lines
    const connectionPaths: EdgePath[] =
      topology.edgePaths.length > 0
        ? topology.edgePaths
        : topology.subnetEdges.map((edge) => {
            const sb = boundsMap.get(edge.sourceSubnet);
            const tb = boundsMap.get(edge.targetSubnet);
            if (!sb || !tb)
              return {
                sourceSubnet: edge.sourceSubnet,
                targetSubnet: edge.targetSubnet,
                points: [] as [number, number][],
              };
            return {
              sourceSubnet: edge.sourceSubnet,
              targetSubnet: edge.targetSubnet,
              points: [
                [sb.x + sb.width / 2, sb.y + sb.height / 2] as [number, number],
                [tb.x + tb.width / 2, tb.y + tb.height / 2] as [number, number],
              ],
            };
          });

    return {
      nodePositions: positions,
      subnetPolygons: polygons,
      subnetLabels: labels,
      allNodes: hostNodes,
      connectionPaths,
    };
  }, [topology]);

  const getHighlightColor = (hostId: string): RGBColor | null => {
    const team = activeHosts.get(hostId);
    if (team) return AGENT_COLORS[team];
    return null;
  };

  const getNodeFillColor = (node: NodeData): RGBColor => {
    const state = nodeStates?.get(node.id);
    // Match previous behavior: only override color for compromised states.
    // Clean/unknown uses the base host-type color.
    if (state && state !== 'clean') return NODE_STATE_COLORS[state];
    return node.color;
  };

  const getNodeFillColorRGBA = (
    node: NodeData
  ): [number, number, number, number] => {
    const [r, g, b] = getNodeFillColor(node);
    return [r, g, b, 255];
  };

  const greenStatusData = useMemo(() => {
    if (greenActiveHosts.size === 0) return [];
    return allNodes
      .filter((n) => greenActiveHosts.has(n.id))
      .map((n) => ({ ...n, failing: greenActiveHosts.get(n.id)! }));
  }, [allNodes, greenActiveHosts]);

  const movements = useMemo(
    () => allMovements.filter((m) => agentVisibility[m.team]),
    [allMovements, agentVisibility]
  );

  const trails: TrailData[] = useMemo(() => {
    if (!viewState) return [];
    const rangeSpan = stepRange.end - stepRange.start;
    return movements
      .map((m) => {
        const ageFactor =
          rangeSpan > 0 ? (m.step - stepRange.start) / rangeSpan : 1;
        return createTrailPath(m, nodePositions, viewState.zoom, ageFactor);
      })
      .filter((t): t is TrailData => t !== null);
  }, [movements, nodePositions, viewState, stepRange]);

  const worldToScreen = (
    worldX: number,
    worldY: number
  ): [number, number] | null => {
    if (!containerSize || !viewState) return null;
    const scale = Math.pow(2, viewState.zoom);
    const [targetX, targetY] = viewState.target;
    const screenX = (worldX - targetX) * scale + containerSize.width / 2;
    const screenY = (worldY - targetY) * scale + containerSize.height / 2;
    return [screenX, screenY];
  };

  const LABEL_OFFSET_Y = -40;
  const LABEL_STACK_GAP = 30;

  // Compute positioned labels, stacking vertically when multiple agents target same host
  const actionLabels: {
    active: ActiveAction;
    position: { x: number; y: number };
  }[] = [];
  {
    const byHost = new Map<string, ActiveAction[]>();
    for (const a of visibleActions) {
      if (!a.Host) continue;
      const list = byHost.get(a.Host) ?? [];
      list.push(a);
      byHost.set(a.Host, list);
    }
    for (const [host, actions] of byHost) {
      const pos = nodePositions.get(host);
      if (!pos) continue;
      const screenPos = worldToScreen(pos[0], pos[1]);
      if (!screenPos) continue;
      actions.forEach((active, idx) => {
        actionLabels.push({
          active,
          position: {
            x: screenPos[0],
            y: screenPos[1] + LABEL_OFFSET_Y - idx * LABEL_STACK_GAP,
          },
        });
      });
    }
  }

  const layers = [
    new PolygonLayer({
      id: 'subnet-backgrounds',
      data: subnetPolygons,
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => d.color,
      getLineColor: [0, 0, 0, 0],
      filled: true,
      stroked: false,
    }),

    new TextLayer({
      id: 'subnet-labels',
      data: subnetLabels,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getColor: [226, 232, 240],
      getSize: 12,
      sizeUnits: 'pixels',
      fontWeight: 'bold',
      background: true,
      getBackgroundColor: (d) => d.color,
      backgroundPadding: [0, 0],
      getTextAnchor: 'start',
      getAlignmentBaseline: 'bottom',
      fontFamily: 'system-ui, sans-serif',
      fontSettings: { sdf: true, fontSize: 64, radius: 24, buffer: 12 },
    }),

    new PathLayer<EdgePath>({
      id: 'subnet-connections',
      data: connectionPaths,
      getPath: (d) => d.points,
      getColor: EDGE_COLORS.firewall,
      getWidth: 3,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
    }),

    new ScatterplotLayer({
      id: 'nodes',
      data: allNodes.filter((n) => !hasHostIcon(n)),
      getPosition: (d) => d.position,
      getRadius: (d) => d.radius,
      getFillColor: getNodeFillColor,
      getLineColor: (d) => {
        const highlight = getHighlightColor(d.id);
        return highlight ?? [0, 0, 0, 0];
      },
      getLineWidth: (d) => (getHighlightColor(d.id) ? 8 : 0),
      lineWidthUnits: 'pixels',
      stroked: true,
      filled: true,
      radiusUnits: 'pixels',
      antialiasing: true,
      pickable: true,
      updateTriggers: {
        getFillColor: [nodeStates],
        getLineColor: [activeHosts],
        getLineWidth: [activeHosts],
      },
    }),

    // Highlight ring for icon-rendered hosts (no fill), so action-target highlighting still works.
    new ScatterplotLayer({
      id: 'icon-node-highlights',
      data: allNodes.filter(hasHostIcon),
      getPosition: (d) => d.position,
      getRadius: () => HOST_ICON_SIZE / 2 + 4,
      getFillColor: [0, 0, 0, 0],
      getLineColor: (d) => {
        const highlight = getHighlightColor(d.id);
        return highlight ?? [0, 0, 0, 0];
      },
      getLineWidth: (d) => (getHighlightColor(d.id) ? 8 : 0),
      lineWidthUnits: 'pixels',
      stroked: true,
      filled: false,
      radiusUnits: 'pixels',
      antialiasing: true,
      pickable: false,
      updateTriggers: {
        getLineColor: [activeHosts],
        getLineWidth: [activeHosts],
      },
    }),

    new PathLayer<TrailData>({
      id: 'agent-trails',
      data: trails,
      getPath: (d) => d.path,
      getColor: (d) => d.color,
      getWidth: 3,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
      updateTriggers: {
        getPath: [stepRange, viewState?.zoom],
        getColor: [stepRange],
      },
    }),

    new IconLayer<RoleNodeData | TypeIconNodeData>({
      id: 'host-icons',
      data: allNodes.filter(hasHostIcon),
      iconAtlas: hostIconAtlas,
      iconMapping: HOST_ICON_MAPPING,
      getIcon: getHostIconKey,
      getPosition: (d) => d.position,
      getSize: HOST_ICON_SIZE,
      sizeUnits: 'pixels',
      getColor: getNodeFillColorRGBA,
      billboard: true,
      pickable: true,
      updateTriggers: {
        getIcon: [topology],
        getColor: [nodeStates],
      },
    }),

    new IconLayer({
      id: 'green-activity-indicators',
      data: greenStatusData,
      iconAtlas: GREEN_STATUS_ATLAS,
      iconMapping: GREEN_STATUS_MAPPING,
      getIcon: (d) => (d.failing ? 'cross' : 'check'),
      getPosition: (d) => d.position,
      getSize: 14,
      sizeUnits: 'pixels',
      getColor: (d) => (d.failing ? [239, 68, 68, 255] : [74, 222, 128, 255]),
      getPixelOffset: [0, -2],
      pickable: false,
      updateTriggers: {
        getIcon: [greenActiveHosts],
        getColor: [greenActiveHosts],
      },
    }),
  ];

  if (!topology || !viewState) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        className="flex items-center justify-center text-slate-400"
      >
        Loading topology...
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {containerSize && (
        <DeckGL
          views={new OrthographicView({ id: 'ortho' })}
          viewState={viewState}
          onViewStateChange={onViewStateChange}
          controller={{
            scrollZoom: { speed: 0.01, smooth: true },
            inertia: true,
          }}
          layers={layers}
          onHover={onHover}
          width={containerSize.width}
          height={containerSize.height}
          useDevicePixels={true}
        />
      )}
      {actionLabels.map((label) => (
        <ActionLabel
          key={label.active.agent}
          active={label.active}
          position={label.position}
        />
      ))}
      {hoveredNode && (
        <HostTooltip
          node={hoveredNode.node}
          x={hoveredNode.x}
          y={hoveredNode.y}
        />
      )}
    </div>
  );
};
