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

// Visual sizes are in deck.gl 'common' units — i.e. world coordinates that
// scale 1:1 with the layout. The min/max bounds (in CSS pixels) clamp the
// rendered size so things stay readable on tiny windows and don't get
// cartoonish at extreme zoom-in. NODE_WIDTH in computeLayout is 30, so an
// icon of 44 world units is ~1.5× the host slot — matches the previous
// CSS-pixel look at typical desktop scale, and grows on bigger displays.
const SIZES = {
  hostIcon: { common: 44, minPx: 28, maxPx: 160 },
  greenStatus: { common: 14, minPx: 12, maxPx: 56 },
  subnetLabel: { common: 12, minPx: 11, maxPx: 32 },
  pathStroke: { common: 3, minPx: 2, maxPx: 10 },
  highlightStroke: { common: 8, minPx: 4, maxPx: 24 },
  nodeStroke: { common: 8, minPx: 4, maxPx: 24 },
  nodeRadiusMinPx: 6,
  nodeRadiusMaxPx: 56,
  highlightRingPad: 4, // common units, added to icon half-size
  highlightRingMinPx: 18,
  highlightRingMaxPx: 90,
} as const;

const HOST_ICON_SIZE = SIZES.hostIcon.common;

type HostIconKey = HostRole | 'server' | 'workstation' | 'defender';

// The atlas SVG has viewBox="0 0 192 32" but is rasterized by the browser at
// its intrinsic width/height — we declare those at 16× the viewBox so deck.gl
// gets a 3072×512 texture (512 per icon tile). That's enough density to stay
// crisp at any practical devicePixelRatio (up to ~10× at HOST_ICON_SIZE=44),
// making icons effectively vector-quality on screen. Bump this further only
// if you also bump HOST_ICON_SIZE for screenshot/poster use.
const HOST_ICON_TILE_PX = 512;

const tile = (
  col: number,
  anchorY = HOST_ICON_TILE_PX / 2
): {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  mask: boolean;
} => ({
  x: col * HOST_ICON_TILE_PX,
  y: 0,
  width: HOST_ICON_TILE_PX,
  height: HOST_ICON_TILE_PX,
  anchorX: HOST_ICON_TILE_PX / 2,
  anchorY,
  mask: true,
});

// The 'front' glyph is visually bottom-heavy; nudge its anchor down 2 viewBox
// units (≈6.25% of a tile) so it visually centers.
const FRONT_ANCHOR_Y = HOST_ICON_TILE_PX / 2 + HOST_ICON_TILE_PX * (2 / 32);

const HOST_ICON_MAPPING: Record<HostIconKey, ReturnType<typeof tile>> = {
  database: tile(0),
  auth: tile(1),
  front: tile(2, FRONT_ANCHOR_Y),
  server: tile(3),
  workstation: tile(4),
  defender: tile(5),
};

// Two 16x16 status glyphs side-by-side. The intrinsic width/height are
// bumped above the viewBox so the browser rasterizes the SVG at high
// density, keeping edges crisp at any devicePixelRatio.
const GREEN_STATUS_TILE_PX = 256;
const GREEN_STATUS_ATLAS =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16" width="${
      GREEN_STATUS_TILE_PX * 2
    }" height="${GREEN_STATUS_TILE_PX}">` +
      '<polyline points="3,8 6.5,12 13,4" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<line x1="19" y1="3" x2="29" y2="13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="29" y1="3" x2="19" y2="13" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>'
  );

const GREEN_STATUS_MAPPING = {
  check: {
    x: 0,
    y: 0,
    width: GREEN_STATUS_TILE_PX,
    height: GREEN_STATUS_TILE_PX,
    anchorX: GREEN_STATUS_TILE_PX / 2,
    anchorY: GREEN_STATUS_TILE_PX / 2,
    mask: true,
  },
  cross: {
    x: GREEN_STATUS_TILE_PX,
    y: 0,
    width: GREEN_STATUS_TILE_PX,
    height: GREEN_STATUS_TILE_PX,
    anchorX: GREEN_STATUS_TILE_PX / 2,
    anchorY: GREEN_STATUS_TILE_PX / 2,
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

  // Pull the trail's endpoints back so they meet the host icon's edge rather
  // than its center. Icons render at HOST_ICON_SIZE world units but get
  // clamped to [minPx, maxPx] in screen space, so we mirror that clamp here
  // to keep the gap correct at any zoom or window size. The −2 nudge
  // preserves the small overlap the old fixed 20 px gap had against the
  // 22 px-radius icons it was tuned against.
  const scale = Math.pow(2, zoom);
  const iconHalfPx = Math.min(
    SIZES.hostIcon.maxPx / 2,
    Math.max(SIZES.hostIcon.minPx / 2, (HOST_ICON_SIZE / 2) * scale)
  );
  const worldGap = (iconHalfPx - 2) / scale;

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
    // Firewall connection paths render BEFORE subnet backgrounds so the line
    // is hidden where it crosses a subnet — visually the connection
    // terminates at the subnet edge instead of sitting on top of it.
    new PathLayer<EdgePath>({
      id: 'subnet-connections',
      data: connectionPaths,
      getPath: (d) => d.points,
      getColor: EDGE_COLORS.firewall,
      getWidth: SIZES.pathStroke.common,
      widthUnits: 'common',
      widthMinPixels: SIZES.pathStroke.minPx,
      widthMaxPixels: SIZES.pathStroke.maxPx,
      capRounded: true,
      jointRounded: true,
    }),

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
      getSize: SIZES.subnetLabel.common,
      sizeUnits: 'common',
      sizeMinPixels: SIZES.subnetLabel.minPx,
      sizeMaxPixels: SIZES.subnetLabel.maxPx,
      fontWeight: 'bold',
      getTextAnchor: 'start',
      getAlignmentBaseline: 'bottom',
      fontFamily: 'system-ui, sans-serif',
      // Bitmap glyphs rasterized by canvas2d at 128 px keep edges crisp when
      // deck.gl downsamples to the rendered size at any zoom or DPR. SDF text
      // would stay infinitely scalable but goes soft at small display sizes.
      fontSettings: { sdf: false, fontSize: 128, buffer: 4 },
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
      getLineWidth: (d) =>
        getHighlightColor(d.id) ? SIZES.nodeStroke.common : 0,
      lineWidthUnits: 'common',
      lineWidthMinPixels: SIZES.nodeStroke.minPx,
      lineWidthMaxPixels: SIZES.nodeStroke.maxPx,
      stroked: true,
      filled: true,
      radiusUnits: 'common',
      radiusMinPixels: SIZES.nodeRadiusMinPx,
      radiusMaxPixels: SIZES.nodeRadiusMaxPx,
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
      getRadius: () => HOST_ICON_SIZE / 2 + SIZES.highlightRingPad,
      getFillColor: [0, 0, 0, 0],
      getLineColor: (d) => {
        const highlight = getHighlightColor(d.id);
        return highlight ?? [0, 0, 0, 0];
      },
      getLineWidth: (d) =>
        getHighlightColor(d.id) ? SIZES.highlightStroke.common : 0,
      lineWidthUnits: 'common',
      lineWidthMinPixels: SIZES.highlightStroke.minPx,
      lineWidthMaxPixels: SIZES.highlightStroke.maxPx,
      stroked: true,
      filled: false,
      radiusUnits: 'common',
      radiusMinPixels: SIZES.highlightRingMinPx,
      radiusMaxPixels: SIZES.highlightRingMaxPx,
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
      getWidth: SIZES.pathStroke.common,
      widthUnits: 'common',
      widthMinPixels: SIZES.pathStroke.minPx,
      widthMaxPixels: SIZES.pathStroke.maxPx,
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
      getSize: SIZES.hostIcon.common,
      sizeUnits: 'common',
      sizeMinPixels: SIZES.hostIcon.minPx,
      sizeMaxPixels: SIZES.hostIcon.maxPx,
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
      getSize: SIZES.greenStatus.common,
      sizeUnits: 'common',
      sizeMinPixels: SIZES.greenStatus.minPx,
      sizeMaxPixels: SIZES.greenStatus.maxPx,
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
