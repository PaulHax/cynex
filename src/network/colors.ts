import type { SubnetId, HostType } from "./topology";

export type RGBAColor = [number, number, number, number];
export type RGBColor = [number, number, number];

export const AGENT_COLORS = {
  blue: [59, 130, 246] as RGBColor,
  red: [239, 68, 68] as RGBColor,
} as const;

export const NODE_STATE_COLORS = {
  clean: [107, 114, 128] as RGBColor,
  compromised: [220, 38, 38] as RGBColor,
  detected: [245, 158, 11] as RGBColor,
  restored: [16, 185, 129] as RGBColor,
} as const;

export const HOST_TYPE_COLORS: Record<HostType | "router" | "firewall", RGBColor> = {
  workstation: [148, 163, 184],
  server: [100, 116, 139],
  defender: [34, 197, 94],
  router: [156, 163, 175],
  firewall: [251, 146, 60],
} as const;

export const SUBNET_BACKGROUND_COLORS: Record<SubnetId, RGBAColor> = {
  User: [59, 130, 246, 25],
  Enterprise: [139, 92, 246, 25],
  Op: [239, 68, 68, 25],
} as const;

export const EDGE_COLORS = {
  normal: [75, 85, 99] as RGBColor,
  firewall: [251, 146, 60] as RGBColor,
} as const;

export const UI_COLORS = {
  background: "#0f172a",
  surface: "#1e293b",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  border: "#334155",
} as const;
