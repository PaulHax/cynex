import { useState, useCallback, useRef, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView, type PickingInfo } from "@deck.gl/core";
import { ScatterplotLayer, LineLayer, PolygonLayer } from "@deck.gl/layers";
import {
  HOSTS,
  INFRASTRUCTURE_NODES,
  EDGES,
  SUBNETS,
  getAllNodePositions,
} from "../network/topology";
import {
  HOST_TYPE_COLORS,
  AGENT_COLORS,
  SUBNET_BACKGROUND_COLORS,
  EDGE_COLORS,
  NODE_STATE_COLORS,
  type RGBColor,
} from "../network/colors";
import type { AgentAction } from "../trajectory/types";
import type { NodeState } from "../trajectory/nodeState";

type NetworkGraphProps = {
  currentBlueAction?: AgentAction;
  currentRedAction?: AgentAction;
  nodeStates?: Map<string, NodeState>;
};

type NodeData = {
  id: string;
  type: string;
  subnet?: string;
  position: [number, number];
  radius: number;
  color: RGBColor;
};

const getTooltip = ({ object }: PickingInfo<NodeData>) => {
  if (!object) return null;

  const lines = [object.id, `Type: ${object.type}`];
  if (object.subnet) {
    lines.push(`Subnet: ${object.subnet}`);
  }

  return {
    html: lines.map((line) => `<div>${line}</div>`).join(""),
    style: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "8px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "monospace",
    },
  };
};

const INITIAL_VIEW_STATE = {
  target: [400, 175, 0] as [number, number, number],
  zoom: 0,
};

const getNodeRadius = (type: string): number => {
  switch (type) {
    case "router":
      return 12;
    case "firewall":
      return 10;
    case "server":
      return 16;
    case "defender":
      return 16;
    default:
      return 14;
  }
};

const createSubnetPolygons = () =>
  SUBNETS.map((subnet) => ({
    id: subnet.id,
    polygon: [
      [subnet.x, 0],
      [subnet.x + subnet.width, 0],
      [subnet.x + subnet.width, 350],
      [subnet.x, 350],
    ],
    color: SUBNET_BACKGROUND_COLORS[subnet.id],
  }));

export const NetworkGraph = ({
  currentBlueAction,
  currentRedAction,
  nodeStates,
}: NetworkGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const onViewStateChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ viewState }: { viewState: any }) => setViewState(viewState),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkReady = () => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        setIsReady(true);
      }
    };

    requestAnimationFrame(checkReady);
  }, []);

  const nodePositions = getAllNodePositions();

  const hostNodes = HOSTS.map((host) => ({
    ...host,
    position: [host.x, host.y] as [number, number],
    radius: getNodeRadius(host.type),
    color: HOST_TYPE_COLORS[host.type] as RGBColor,
  }));

  const infraNodes = INFRASTRUCTURE_NODES.map((node) => ({
    ...node,
    position: [node.x, node.y] as [number, number],
    radius: getNodeRadius(node.type),
    color: HOST_TYPE_COLORS[node.type] as RGBColor,
  }));

  const allNodes = [...hostNodes, ...infraNodes];

  const edges = EDGES.map((edge) => {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    return {
      ...edge,
      sourcePosition: sourcePos ?? [0, 0],
      targetPosition: targetPos ?? [0, 0],
    };
  });

  const getHighlightColor = (hostId: string): RGBColor | null => {
    if (currentBlueAction?.Host === hostId) return AGENT_COLORS.blue;
    if (currentRedAction?.Host === hostId) return AGENT_COLORS.red;
    return null;
  };

  const getNodeFillColor = (node: NodeData): RGBColor => {
    const state = nodeStates?.get(node.id);
    if (state === "compromised") {
      return NODE_STATE_COLORS.detected;
    }
    return node.color;
  };

  const layers = [
    new PolygonLayer({
      id: "subnet-backgrounds",
      data: createSubnetPolygons(),
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => d.color,
      getLineColor: [0, 0, 0, 0],
      filled: true,
      stroked: false,
    }),

    new LineLayer({
      id: "edges",
      data: edges,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getColor: (d) =>
        d.isFirewall ? EDGE_COLORS.firewall : EDGE_COLORS.normal,
      getWidth: (d) => (d.isFirewall ? 3 : 2),
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
      getLineWidth: (d) => (getHighlightColor(d.id) ? 3 : 0),
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
  ];

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {isReady && (
        <DeckGL
          views={new OrthographicView({ id: "ortho" })}
          viewState={viewState}
          onViewStateChange={onViewStateChange}
          controller={{
            scrollZoom: { speed: 0.01, smooth: true },
            inertia: true,
          }}
          layers={layers}
          getTooltip={getTooltip}
          width="100%"
          height="100%"
        />
      )}
    </div>
  );
};
