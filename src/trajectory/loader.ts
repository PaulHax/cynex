import type {
  TrajectoryFile,
  TrajectoryFileV2,
  AnyTrajectoryFile,
} from './types';

type TrajectoryManifest = {
  files: string[];
};

export const loadTrajectory = async (
  path: string
): Promise<AnyTrajectoryFile> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load trajectory: ${response.statusText}`);
  }
  return response.json();
};

export const loadTrajectoryManifest = async (): Promise<TrajectoryManifest> => {
  const response = await fetch('/data/trajectories/manifest.json');
  if (!response.ok) {
    return { files: [] };
  }
  return response.json();
};

export const validateTrajectory = (data: unknown): data is TrajectoryFile => {
  if (typeof data !== 'object' || data === null) return false;
  const t = data as Record<string, unknown>;
  return (
    typeof t.blue_agent_name === 'string' &&
    typeof t.red_agent_name === 'string' &&
    typeof t.episode === 'number' &&
    Array.isArray(t.blue_actions) &&
    Array.isArray(t.red_actions) &&
    Array.isArray(t.metric_scores) &&
    typeof t.network_topology === 'object'
  );
};

export const validateTrajectoryV2 = (
  data: unknown
): data is TrajectoryFileV2 => {
  if (typeof data !== 'object' || data === null) return false;
  const t = data as Record<string, unknown>;
  return (
    t.format_version === '2.0' &&
    typeof t.episode === 'number' &&
    typeof t.total_steps === 'number' &&
    typeof t.agent_actions === 'object' &&
    Array.isArray(t.step_states) &&
    typeof t.subnet_metadata === 'object' &&
    typeof t.network_topology === 'object'
  );
};

export const parseTrajectoryFile = async (
  file: File
): Promise<AnyTrajectoryFile> => {
  const text = await file.text();
  const data = JSON.parse(text);
  if (validateTrajectoryV2(data)) return data;
  if (validateTrajectory(data)) return data;
  throw new Error('Invalid trajectory file format');
};
