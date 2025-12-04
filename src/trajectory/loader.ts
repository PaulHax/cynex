import type { TrajectoryFile } from "./types";

export const loadTrajectory = async (path: string): Promise<TrajectoryFile> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load trajectory: ${response.statusText}`);
  }
  return response.json();
};

export const loadDefaultTrajectory = (): Promise<TrajectoryFile> =>
  loadTrajectory("/data/trajectories/default.json");
