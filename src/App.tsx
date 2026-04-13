import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type DragEvent,
} from 'react';
import { NetworkGraph } from './view/NetworkGraph';
import { ActionPanel } from './view/ActionPanel';
import { StepControls } from './view/StepControls';
import { TrajectorySelector } from './view/TrajectorySelector';
import type { StepRange } from './view/RangeSlider';
import {
  loadTrajectoryManifest,
  loadTrajectory,
  parseTrajectoryFile,
} from './trajectory/loader';
import { computeNodeStates } from './trajectory/nodeState';
import { getMovementsInRange } from './trajectory/computeTrails';
import { useNetworkTopology } from './network/useNetworkTopology';
import type { Trajectory, ActiveAction } from './trajectory/types';
import { resolveEffectiveAction } from './trajectory/types';

export type AgentVisibility = { blue: boolean; red: boolean };

const App = () => {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [trajectoryName, setTrajectoryName] = useState<string | null>(null);
  const [stepRange, setStepRange] = useState<StepRange>({ start: 0, end: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [dropLoading, setDropLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [agentVisibility, setAgentVisibility] = useState<AgentVisibility>({
    blue: true,
    red: true,
  });

  useEffect(() => {
    const loadInitialTrajectory = async () => {
      const params = new URLSearchParams(window.location.search);
      const fileParam = params.get('file');

      if (fileParam) {
        try {
          const data = await loadTrajectory(fileParam);
          setTrajectory(data);
          setTrajectoryName(fileParam.split('/').pop() ?? fileParam);
          setInitialLoading(false);
          return;
        } catch (err) {
          console.error('Failed to load trajectory from URL param:', err);
        }
      }

      const manifest = await loadTrajectoryManifest();
      if (manifest.files.length > 0) {
        const firstFile = manifest.files[0];
        try {
          const data = await loadTrajectory(`/data/trajectories/${firstFile}`);
          setTrajectory(data);
          setTrajectoryName(firstFile);
        } catch {
          // No default trajectory available, user will need to load one
        }
      }
      setInitialLoading(false);
    };

    loadInitialTrajectory();
  }, []);

  const totalSteps = trajectory?.totalSteps ?? 0;

  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;

    const interval = setInterval(() => {
      setStepRange((prev) => {
        const nextEnd = prev.end + 1;
        if (nextEnd >= totalSteps) {
          setIsPlaying(false);
          return prev;
        }
        return { ...prev, end: nextEnd };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, totalSteps]);

  const handlePlayToggle = useCallback(() => {
    if (stepRange.end >= totalSteps - 1) return;
    setIsPlaying((prev) => !prev);
  }, [stepRange.end, totalSteps]);

  const handleTrajectoryLoad = useCallback((data: Trajectory, name: string) => {
    setTrajectory(data);
    setTrajectoryName(name);
    setStepRange({ start: 0, end: 0 });
    setDropError(null);
    setIsPlaying(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file?.name.endsWith('.json')) {
        setDropError('Please drop a JSON file');
        return;
      }
      setDropLoading(true);
      setDropError(null);
      try {
        const data = await parseTrajectoryFile(file);
        handleTrajectoryLoad(data, file.name);
      } catch (err) {
        setDropError(
          err instanceof Error ? err.message : 'Invalid trajectory file'
        );
      } finally {
        setDropLoading(false);
      }
    },
    [handleTrajectoryLoad]
  );

  const nodeStates = useMemo(() => {
    if (!trajectory) return undefined;
    return computeNodeStates(trajectory.stepStates, stepRange.end);
  }, [trajectory, stepRange.end]);

  const movements = useMemo(() => {
    if (!trajectory) return [];
    return getMovementsInRange(
      trajectory.agentActions,
      trajectory.blueAgents,
      trajectory.redAgents,
      stepRange
    );
  }, [trajectory, stepRange]);

  const blueSet = useMemo(
    () => new Set(trajectory?.blueAgents ?? []),
    [trajectory]
  );

  const activeActions: ActiveAction[] = useMemo(() => {
    if (!trajectory) return [];
    const step = stepRange.end;
    const result: ActiveAction[] = [];
    for (const agent of [...trajectory.blueAgents, ...trajectory.redAgents]) {
      const actions = trajectory.agentActions[agent];
      if (!actions) continue;
      const resolved = resolveEffectiveAction(actions, step);
      if (resolved) {
        result.push({
          agent,
          team: blueSet.has(agent) ? 'blue' : 'red',
          Action: resolved.action.Action,
          Status: resolved.action.Status,
          Host: resolved.action.Host,
          inProgress: resolved.inProgress,
        });
      }
    }
    return result;
  }, [trajectory, stepRange.end, blueSet]);

  const greenActiveHosts: Map<string, number> = useMemo(() => {
    const map = new Map<string, number>();
    if (!trajectory) return map;
    const step = stepRange.end;
    for (const agent of trajectory.greenAgents) {
      const actions = trajectory.agentActions[agent];
      if (!actions) continue;
      const resolved = resolveEffectiveAction(actions, step);
      if (resolved && resolved.action.Host) {
        const host = resolved.action.Host;
        map.set(host, (map.get(host) ?? 0) + 1);
      }
    }
    return map;
  }, [trajectory, stepRange.end]);

  const topology = useNetworkTopology(trajectory);

  const hostCount = trajectory
    ? Object.keys(trajectory.networkTopology).length
    : 0;

  // Data-driven header: single-agent matchups get "A vs B", multi-agent gets challenge name
  const headerText = trajectory
    ? trajectory.blueAgents.length === 1 && trajectory.redAgents.length === 1
      ? `${trajectory.blueAgents[0]} vs ${trajectory.redAgents[0]} — Episode ${trajectory.episode} — ${hostCount} hosts`
      : `${trajectory.challenge} — ${hostCount} hosts — Episode ${trajectory.episode}`
    : null;

  const currentStepState = trajectory
    ? trajectory.stepStates[
        Math.min(stepRange.end, trajectory.stepStates.length - 1)
      ]
    : undefined;

  const currentScore = trajectory?.metricScores[stepRange.end];

  if (initialLoading) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="h-full bg-slate-900 flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-4 border-dashed border-blue-400 rounded-2xl p-12 text-blue-300 text-2xl">
            Drop trajectory JSON here
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div
          className={`relative flex-shrink-0 w-[420px] flex flex-col p-4 gap-4 transition-all duration-200 ${sidebarCollapsed ? '-ml-[420px]' : ''}`}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`absolute top-4 z-10 bg-slate-900 hover:bg-slate-800 rounded-lg p-1.5 text-slate-400 hover:text-slate-200 transition-all shadow-lg ${
              sidebarCollapsed
                ? 'left-[calc(100%+0.5rem)] right-auto'
                : '-right-4'
            }`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <header className="flex-shrink-0">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-3">
                <TrajectorySelector
                  onTrajectoryLoad={handleTrajectoryLoad}
                  currentName={trajectoryName}
                  loading={dropLoading}
                  error={dropError}
                />
              </div>
              {headerText && (
                <p className="text-slate-400 text-sm mt-1">{headerText}</p>
              )}
            </div>
          </header>

          {!trajectory ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4">
                <p className="text-slate-400">
                  Load a trajectory file to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ActionPanel
                stepRange={stepRange}
                totalSteps={totalSteps}
                score={currentScore}
                stepState={currentStepState}
                onStepRangeChange={setStepRange}
                agentVisibility={agentVisibility}
                onAgentVisibilityChange={setAgentVisibility}
                agentActions={trajectory.agentActions}
                blueAgents={trajectory.blueAgents}
                redAgents={trajectory.redAgents}
              />
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-slate-950">
          {trajectory && (
            <NetworkGraph
              activeActions={activeActions}
              greenActiveHosts={greenActiveHosts}
              movements={movements}
              stepRange={stepRange}
              nodeStates={nodeStates}
              topology={topology}
              agentVisibility={agentVisibility}
            />
          )}
        </div>
      </div>

      {trajectory && (
        <StepControls
          stepRange={stepRange}
          totalSteps={totalSteps}
          onStepRangeChange={setStepRange}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
        />
      )}
    </div>
  );
};

export default App;
