import type { TrajectoryFile } from "./types";

type TrajectoryManifest = {
  files: string[];
};

export const loadTrajectory = async (path: string): Promise<TrajectoryFile> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load trajectory: ${response.statusText}`);
  }
  return response.json();
};

export const loadTrajectoryManifest = async (): Promise<TrajectoryManifest> => {
  const response = await fetch("/data/trajectories/manifest.json");
  if (!response.ok) {
    return { files: [] };
  }
  return response.json();
};

export const validateTrajectory = (data: unknown): data is TrajectoryFile => {
  if (typeof data !== "object" || data === null) return false;
  const t = data as Record<string, unknown>;
  return (
    typeof t.blue_agent_name === "string" &&
    typeof t.red_agent_name === "string" &&
    typeof t.episode === "number" &&
    Array.isArray(t.blue_actions) &&
    Array.isArray(t.red_actions) &&
    Array.isArray(t.metric_scores) &&
    typeof t.network_topology === "object"
  );
};

export const parseTrajectoryFile = async (file: File): Promise<TrajectoryFile> => {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!validateTrajectory(data)) {
    throw new Error("Invalid trajectory file format");
  }
  return data;
};
