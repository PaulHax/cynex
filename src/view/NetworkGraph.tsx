import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView, type PickingInfo } from "@deck.gl/core";
import { ScatterplotLayer, LineLayer, PolygonLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import type { LayoutResult, SubnetBounds } from "../network/computeLayout";
import {
  HOST_TYPE_COLORS,
  AGENT_COLORS,
  EDGE_COLORS,
  NODE_STATE_COLORS,
  getSubnetColor,
  type RGBColor,
} from "../network/colors";
import type { AgentAction } from "../trajectory/types";
import type { NodeState } from "../trajectory/nodeState";

type NetworkGraphProps = {
  currentBlueAction?: AgentAction;
  currentRedAction?: AgentAction;
  previousBlueAction?: AgentAction;
  previousRedAction?: AgentAction;
  nodeStates?: Map<string, NodeState>;
  topology: LayoutResult | null;
};

type TrailData = {
  path: [number, number][];
  color: [number, number, number, number][];
};

type NodeData = {
  id: string;
  type: string;
  subnet?: string;
  position: [number, number];
  radius: number;
  color: RGBColor;
};

const Z_INDEX = {
  ACTION_LABEL: 10,
  HOST_TOOLTIP: 20,
};

const getNodeRadius = (type: string): number => {
  switch (type) {
    case "server":
      return 16;
    case "defender":
      return 16;
    default:
      return 14;
  }
};

const createTrailPath = (
  fromHost: string | undefined,
  toHost: string | undefined,
  agentColor: RGBColor,
  nodePositions: Map<string, [number, number]>,
  zoom: number
): TrailData | null => {
  if (!fromHost || !toHost || fromHost === toHost) return null;

  const fromPos = nodePositions.get(fromHost);
  const toPos = nodePositions.get(toHost);
  if (!fromPos || !toPos) return null;

  const dx = toPos[0] - fromPos[0];
  const dy = toPos[1] - fromPos[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const pixelGap = 20;
  const scale = Math.pow(2, zoom);
  const worldGap = pixelGap / scale;

  const edgeStart: [number, number] = [fromPos[0] + ux * worldGap, fromPos[1] + uy * worldGap];
  const edgeEnd: [number, number] = [toPos[0] - ux * worldGap, toPos[1] - uy * worldGap];

  const segments = 10;
  const path: [number, number][] = [];
  const colors: [number, number, number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    path.push([
      edgeStart[0] + (edgeEnd[0] - edgeStart[0]) * t,
      edgeStart[1] + (edgeEnd[1] - edgeStart[1]) * t,
    ]);
    const alpha = Math.round(20 + 160 * t);
    colors.push([agentColor[0], agentColor[1], agentColor[2], alpha]);
  }

  return { path, color: colors };
};

export const NetworkGraph = ({
  currentBlueAction,
  currentRedAction,
  previousBlueAction,
  previousRedAction,
  nodeStates,
  topology,
}: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [viewState, setViewState] = useState<{
    target: [number, number, number];
    zoom: number;
  } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    node: NodeData;
    x: number;
    y: number;
  } | null>(null);

  const onHover = useCallback((info: PickingInfo<NodeData>) => {
    if (info.object && info.x !== undefined && info.y !== undefined) {
      setHoveredNode({ node: info.object, x: info.x, y: info.y });
    } else {
      setHoveredNode(null);
    }
  }, []);

  const onViewStateChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ viewState }: { viewState: any }) => setViewState(viewState),
    [],
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

  useEffect(() => {
    if (!topology) return;

    const allX = topology.hosts.map((h) => h.x);
    const allY = topology.hosts.map((h) => h.y);

    if (allX.length === 0) return;

    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setViewState({
      target: [centerX, centerY, 0],
      zoom: 0,
    });
  }, [topology]);

  const { nodePositions, subnetPolygons, subnetLabels, allNodes, subnetConnectionEdges } = useMemo(() => {
    if (!topology) {
      return {
        nodePositions: new Map<string, [number, number]>(),
        subnetPolygons: [],
        subnetLabels: [],
        allNodes: [],
        subnetConnectionEdges: [],
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

    const formatSubnetLabel = (id: string): string => {
      const parts = id.split("_");
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const labels = topology.subnetBounds.map((bounds, idx) => ({
      id: bounds.id,
      text: formatSubnetLabel(bounds.id),
      position: [bounds.x, bounds.y] as [number, number],
      color: getSubnetColor(idx),
    }));

    const hostNodes = topology.hosts.map((host) => ({
      ...host,
      position: [host.x, host.y] as [number, number],
      radius: getNodeRadius(host.type),
      color: HOST_TYPE_COLORS[host.type] as RGBColor,
    }));

    const connectionEdges = topology.subnetEdges.map((edge) => {
      const sourceBounds = boundsMap.get(edge.sourceSubnet);
      const targetBounds = boundsMap.get(edge.targetSubnet);

      if (!sourceBounds || !targetBounds) {
        return {
          sourcePosition: [0, 0] as [number, number],
          targetPosition: [0, 0] as [number, number],
        };
      }

      const sourceRight = sourceBounds.x + sourceBounds.width;
      const sourceCenterY = sourceBounds.y + sourceBounds.height / 2;
      const targetLeft = targetBounds.x;
      const targetCenterY = targetBounds.y + targetBounds.height / 2;

      return {
        sourcePosition: [sourceRight, sourceCenterY] as [number, number],
        targetPosition: [targetLeft, targetCenterY] as [number, number],
      };
    });

    return {
      nodePositions: positions,
      subnetPolygons: polygons,
      subnetLabels: labels,
      allNodes: hostNodes,
      subnetConnectionEdges: connectionEdges,
    };
  }, [topology]);

  const getHighlightColor = (hostId: string): RGBColor | null => {
    if (currentBlueAction?.Host === hostId) return AGENT_COLORS.blue;
    if (currentRedAction?.Host === hostId) return AGENT_COLORS.red;
    return null;
  };

  const getNodeFillColor = (node: NodeData): RGBColor => {
    const state = nodeStates?.get(node.id);
    if (state === "root_access") {
      return NODE_STATE_COLORS.root_access;
    }
    if (state === "user_access") {
      return NODE_STATE_COLORS.user_access;
    }
    return node.color;
  };

  const trails: TrailData[] = viewState
    ? [
        createTrailPath(previousBlueAction?.Host, currentBlueAction?.Host, AGENT_COLORS.blue, nodePositions, viewState.zoom),
        createTrailPath(previousRedAction?.Host, currentRedAction?.Host, AGENT_COLORS.red, nodePositions, viewState.zoom),
      ].filter((t): t is TrailData => t !== null)
    : [];

  const worldToScreen = (worldX: number, worldY: number): [number, number] | null => {
    if (!containerSize || !viewState) return null;
    const scale = Math.pow(2, viewState.zoom);
    const [targetX, targetY] = viewState.target;
    const screenX = (worldX - targetX) * scale + containerSize.width / 2;
    const screenY = (worldY - targetY) * scale + containerSize.height / 2;
    return [screenX, screenY];
  };

  const getActionLabelPosition = (action: AgentAction | undefined, pixelOffset: number): { x: number; y: number } | null => {
    if (!action?.Host) return null;
    const pos = nodePositions.get(action.Host);
    if (!pos) return null;
    const screenPos = worldToScreen(pos[0], pos[1]);
    if (!screenPos) return null;
    return { x: screenPos[0], y: screenPos[1] + pixelOffset };
  };

  const TOOLTIP_OFFSET_Y = -40;
  const TOOLTIP_HEIGHT_ESTIMATE = 28;
  const NUDGE_MARGIN = 4;

  const estimateTooltipWidth = (actionText: string): number => {
    const PADDING = 12;
    const ICON_AND_GAP = 14;
    const CHAR_WIDTH = 7;
    return PADDING + ICON_AND_GAP + actionText.length * CHAR_WIDTH;
  };

  const rawBluePos = getActionLabelPosition(currentBlueAction, TOOLTIP_OFFSET_Y);
  const rawRedPos = getActionLabelPosition(currentRedAction, TOOLTIP_OFFSET_Y);

  const computeNudgedPositions = (
    pos1: { x: number; y: number } | null,
    pos2: { x: number; y: number } | null,
    action1: AgentAction | undefined,
    action2: AgentAction | undefined
  ): [{ x: number; y: number } | null, { x: number; y: number } | null] => {
    if (!pos1 || !pos2 || !action1 || !action2) return [pos1, pos2];

    const halfWidth1 = estimateTooltipWidth(action1.Action) / 2;
    const halfWidth2 = estimateTooltipWidth(action2.Action) / 2;
    const halfHeight = TOOLTIP_HEIGHT_ESTIMATE / 2;

    const box1 = {
      left: pos1.x - halfWidth1,
      right: pos1.x + halfWidth1,
      top: pos1.y - halfHeight,
      bottom: pos1.y + halfHeight,
    };
    const box2 = {
      left: pos2.x - halfWidth2,
      right: pos2.x + halfWidth2,
      top: pos2.y - halfHeight,
      bottom: pos2.y + halfHeight,
    };

    const overlapX = box1.right > box2.left && box1.left < box2.right;
    const overlapY = box1.bottom > box2.top && box1.top < box2.bottom;

    if (overlapX && overlapY) {
      const overlapAmount = Math.min(box1.right, box2.right) - Math.max(box1.left, box2.left);
      const nudgeDistance = (overlapAmount / 2) + NUDGE_MARGIN;

      if (pos1.x <= pos2.x) {
        return [
          { x: pos1.x - nudgeDistance, y: pos1.y },
          { x: pos2.x + nudgeDistance, y: pos2.y },
        ];
      } else {
        return [
          { x: pos1.x + nudgeDistance, y: pos1.y },
          { x: pos2.x - nudgeDistance, y: pos2.y },
        ];
      }
    }

    return [pos1, pos2];
  };

  const [bluePos, redPos] = computeNudgedPositions(rawBluePos, rawRedPos, currentBlueAction, currentRedAction);

  const layers = [
    new PolygonLayer({
      id: "subnet-backgrounds",
      data: subnetPolygons,
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => d.color,
      getLineColor: [0, 0, 0, 0],
      filled: true,
      stroked: false,
    }),

    new TextLayer({
      id: "subnet-labels",
      data: subnetLabels,
      getPosition: (d) => d.position,
      getText: (d) => d.text,
      getColor: [226, 232, 240],
      getSize: 12,
      sizeUnits: "pixels",
      fontWeight: "bold",
      background: true,
      getBackgroundColor: (d) => d.color,
      backgroundPadding: [0, 0],
      getTextAnchor: "start",
      getAlignmentBaseline: "bottom",
      fontFamily: "system-ui, sans-serif",
      fontSettings: { sdf: true, fontSize: 64, radius: 24, buffer: 12 },
    }),

    new LineLayer({
      id: "subnet-connections",
      data: subnetConnectionEdges,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getColor: EDGE_COLORS.firewall,
      getWidth: 3,
      widthUnits: "pixels",
    }),

    new ScatterplotLayer({
      id: "nodes",
      data: allNodes,
      getPosition: (d) => d.position,
      getRadius: (d) => d.radius,
      getFillColor: getNodeFillColor,
      getLineColor: (d) => {
        const highlight = getHighlightColor(d.id);
        return highlight ?? [0, 0, 0, 0];
      },
      getLineWidth: (d) => (getHighlightColor(d.id) ? 8 : 0),
      lineWidthUnits: "pixels",
      stroked: true,
      filled: true,
      radiusUnits: "pixels",
      antialiasing: true,
      pickable: true,
      updateTriggers: {
        getFillColor: [nodeStates],
        getLineColor: [currentBlueAction?.Host, currentRedAction?.Host],
        getLineWidth: [currentBlueAction?.Host, currentRedAction?.Host],
      },
    }),

    new PathLayer<TrailData>({
      id: "agent-trails",
      data: trails,
      getPath: (d) => d.path,
      getColor: (d) => d.color,
      getWidth: 3,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true,
      updateTriggers: {
        getPath: [previousBlueAction?.Host, currentBlueAction?.Host, previousRedAction?.Host, currentRedAction?.Host, viewState?.zoom],
        getColor: [previousBlueAction?.Host, currentBlueAction?.Host, previousRedAction?.Host, currentRedAction?.Host],
      },
    }),
  ];

  const ActionLabel = ({ action, position, color }: { action: AgentAction; position: { x: number; y: number }; color: string }) => {
    const statusIcon = action.Status === "TRUE" ? "✓" : "✗";
    const statusColor = action.Status === "TRUE" ? "#4ade80" : "#94a3b8";
    return (
      <div
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(30, 41, 59, 0.95)",
          border: `1px solid ${color}`,
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "12px",
          fontWeight: 500,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          zIndex: Z_INDEX.ACTION_LABEL,
        }}
      >
        <span style={{ color: statusColor }}>{statusIcon}</span>
        <span style={{ color: "#e2e8f0" }}>{action.Action}</span>
      </div>
    );
  };

  const HostTooltip = ({ node, x, y }: { node: NodeData; x: number; y: number }) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(10px, 10px)",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        pointerEvents: "none",
        zIndex: Z_INDEX.HOST_TOOLTIP,
      }}
    >
      <div>{node.id}</div>
      <div>Type: {node.type}</div>
      {node.subnet && <div>Subnet: {node.subnet}</div>}
    </div>
  );

  if (!topology || !viewState) {
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
        className="flex items-center justify-center text-slate-400"
      >
        Loading topology...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    >
      {containerSize && (
        <DeckGL
          views={new OrthographicView({ id: "ortho" })}
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
      {currentBlueAction && bluePos && (
        <ActionLabel action={currentBlueAction} position={bluePos} color="#60a5fa" />
      )}
      {currentRedAction && redPos && (
        <ActionLabel action={currentRedAction} position={redPos} color="#f87171" />
      )}
      {hoveredNode && (
        <HostTooltip node={hoveredNode.node} x={hoveredNode.x} y={hoveredNode.y} />
      )}
    </div>
  );
};
