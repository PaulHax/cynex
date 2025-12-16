import type { HostType } from './extractTopology';

export type RGBAColor = [number, number, number, number];
export type RGBColor = [number, number, number];

export const AGENT_COLORS = {
  blue: [59, 130, 246] as RGBColor,
  red: [239, 68, 68] as RGBColor,
} as const;

export const NODE_STATE_COLORS = {
  clean: [107, 114, 128] as RGBColor,
  user_access: [251, 191, 36] as RGBColor,
  root_access: [219, 88, 140] as RGBColor,
  detected: [245, 158, 11] as RGBColor,
  restored: [16, 185, 129] as RGBColor,
} as const;

export const HOST_TYPE_COLORS: Record<HostType, RGBColor> = {
  workstation: [148, 163, 184],
  server: [100, 116, 139],
  defender: [34, 197, 94],
} as const;

const SUBNET_COLOR_PALETTE: RGBAColor[] = [
  [59, 130, 246, 25], // blue
  [139, 92, 246, 25], // purple
  [239, 68, 68, 25], // red
  [16, 185, 129, 25], // green
  [245, 158, 11, 25], // amber
  [236, 72, 153, 25], // pink
  [14, 165, 233, 25], // sky
  [168, 85, 247, 25], // violet
];

export const getSubnetColor = (index: number): RGBAColor =>
  SUBNET_COLOR_PALETTE[index % SUBNET_COLOR_PALETTE.length];

export const EDGE_COLORS = {
  normal: [75, 85, 99] as RGBColor,
  firewall: [251, 146, 60] as RGBColor,
} as const;

export const UI_COLORS = {
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#334155',
} as const;
