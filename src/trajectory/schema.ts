import { z } from 'zod';

const subnetSchema = z.object({
  network_address: z.string(),
  netmask: z.string(),
  _prefixlen: z.number(),
});

const networkInterfaceSchema = z.object({
  'Interface Name': z.string(),
  'IP Address': z.string(),
  Subnet: subnetSchema,
});

const sessionSchema = z.object({
  Username: z.string(),
  ID: z.number(),
  Timeout: z.number(),
  PID: z.number(),
  Type: z.string(),
  Agent: z.string(),
});

const processSchema = z.object({
  PID: z.number(),
  Username: z.string(),
});

const groupSchema = z.object({
  GID: z.number(),
});

const userInfoSchema = z.object({
  Username: z.string(),
  Password: z.string().optional(),
  Groups: z.array(groupSchema).optional(),
});

const systemInfoSchema = z.object({
  Hostname: z.string(),
  OSType: z.enum(['LINUX', 'WINDOWS']),
  OSDistribution: z.string(),
  OSVersion: z.string(),
  Architecture: z.string(),
});

const hostInfoSchema = z.object({
  Interface: z.array(networkInterfaceSchema),
  Sessions: z.array(sessionSchema),
  Processes: z.array(processSchema),
  'User Info': z.array(userInfoSchema),
  'System info': systemInfoSchema,
});

const agentActionV1Schema = z.object({
  Action: z.string(),
  Status: z.string(),
  Host: z.string(),
});

const agentActionSchema = z.object({
  step: z.number(),
  Action: z.string(),
  Status: z.string(),
  Host: z.string(),
  Params: z.record(z.string(), z.unknown()),
});

const metricScoreSchema = z.object({
  C: z.number(),
  I: z.number(),
  A: z.number(),
  Resilience: z.number(),
});

const subnetMetadataSchema = z.object({
  label: z.string(),
  network_address: z.string(),
  netmask: z.string(),
  nacl_connections: z.array(z.string()),
});

const stepStateSchema = z.object({
  step: z.number(),
  mission_phase: z.number(),
  host_compromise: z.record(z.string(), z.enum(['NONE', 'USER', 'PRIVILEGED'])),
  rewards: z.record(z.string(), z.number()),
  cumulative_reward: z.record(z.string(), z.number()),
});

export const trajectoryV1Schema = z.object({
  blue_agent_name: z.string(),
  red_agent_name: z.string(),
  episode: z.number(),
  experiment_time: z.string(),
  network_topology: z.record(z.string(), hostInfoSchema),
  blue_actions: z.array(agentActionV1Schema),
  red_actions: z.array(agentActionV1Schema),
  metric_scores: z.array(metricScoreSchema),
});

export const trajectoryV2Schema = z.object({
  format_version: z.literal('2.0'),
  challenge: z.string(),
  episode: z.number(),
  seed: z.number(),
  total_steps: z.number(),
  experiment_time: z.string(),
  blue_agents: z.array(z.string()),
  red_agents: z.array(z.string()),
  green_agents: z.array(z.string()),
  network_topology: z.record(z.string(), hostInfoSchema),
  subnet_metadata: z.record(z.string(), subnetMetadataSchema),
  agent_actions: z.record(z.string(), z.array(agentActionSchema)),
  step_states: z.array(stepStateSchema),
  metric_scores: z.array(metricScoreSchema),
  blue_agent_name: z.string(),
  red_agent_name: z.string(),
  blue_actions: z.array(agentActionSchema),
  red_actions: z.array(agentActionSchema),
});

export type RawV1 = z.infer<typeof trajectoryV1Schema>;
export type RawV2 = z.infer<typeof trajectoryV2Schema>;
