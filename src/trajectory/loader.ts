import type { Trajectory } from './types';
import { parseTrajectory } from './normalize';

type TrajectoryManifest = {
  files: string[];
};

export const loadTrajectory = async (path: string): Promise<Trajectory> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load trajectory: ${response.statusText}`);
  }
  const data = await response.json();
  return parseTrajectory(data);
};

export const loadTrajectoryManifest = async (): Promise<TrajectoryManifest> => {
  const response = await fetch('/data/trajectories/manifest.json');
  if (!response.ok) {
    return { files: [] };
  }
  return response.json();
};

export const parseTrajectoryFile = async (file: File): Promise<Trajectory> => {
  const text = await file.text();
  const data = JSON.parse(text);
  return parseTrajectory(data);
};
