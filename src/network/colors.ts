import type { HostType } from './extractTopology';

export type RGBAColor = [number, number, number, number];
export type RGBColor = [number, number, number];

export const AGENT_COLORS = {
  blue: [59, 130, 246] as RGBColor,
  red: [239, 68, 68] as RGBColor,
  green: [34, 197, 94] as RGBColor,
} as const;

export const NODE_STATE_COLORS = {
  clean: [107, 114, 128] as RGBColor,
  user_access: [222, 190, 100] as RGBColor,
  root_access: [205, 130, 155] as RGBColor,
  detected: [245, 158, 11] as RGBColor,
  restored: [16, 185, 129] as RGBColor,
} as const;

export const HOST_TYPE_COLORS: Record<HostType, RGBColor> = {
  workstation: [148, 163, 184],
  server: [100, 116, 139],
  defender: [34, 197, 94],
  router: [56, 189, 248],
} as const;

// Opaque equivalents of each tinted hue blended over bg-slate-950 at alpha 25.
// Subnet polygons are now opaque (alpha 255) so the firewall connection lines
// can render beneath them and stay hidden where they enter a subnet — but the
// apparent dark-tinted color matches the previous semitransparent rendering.
const SUBNET_COLOR_PALETTE: RGBAColor[] = [
  [8, 18, 45, 255], // blue
  [15, 14, 45, 255], // purple
  [25, 12, 27, 255], // red
  [3, 24, 33, 255], // green
  [26, 21, 22, 255], // amber
  [25, 12, 36, 255], // pink
  [3, 22, 44, 255], // sky
  [18, 14, 45, 255], // violet
  [25, 23, 22, 255], // yellow
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
