import { useState, useEffect, useCallback, useMemo } from "react";
import { NetworkGraph } from "./view/NetworkGraph";
import { ActionPanel } from "./view/ActionPanel";
import { StepControls } from "./view/StepControls";
import { TrajectorySelector } from "./view/TrajectorySelector";
import { loadTrajectoryManifest, loadTrajectory } from "./trajectory/loader";
import { computeNodeStates } from "./trajectory/nodeState";
import type { TrajectoryFile } from "./trajectory/types";

const App = () => {
  const [trajectory, setTrajectory] = useState<TrajectoryFile | null>(null);
  const [trajectoryName, setTrajectoryName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadTrajectoryManifest().then(async (manifest) => {
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
    });
  }, []);

  const handleTrajectoryLoad = useCallback((data: TrajectoryFile, name: string) => {
    setTrajectory(data);
    setTrajectoryName(name);
    setCurrentStep(0);
  }, []);

  const nodeStates = useMemo(() => {
    if (!trajectory) return undefined;
    return computeNodeStates(
      trajectory.blue_actions,
      trajectory.red_actions,
      currentStep
    );
  }, [trajectory, currentStep]);

  if (initialLoading) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-slate-900">
      {trajectory && (
        <NetworkGraph
          currentBlueAction={trajectory.blue_actions[currentStep]}
          currentRedAction={trajectory.red_actions[currentStep]}
          nodeStates={nodeStates}
        />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <header className="p-4 pointer-events-auto inline-block">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-xl font-bold text-slate-100">Cynex</h1>
              <TrajectorySelector
                onTrajectoryLoad={handleTrajectoryLoad}
                currentName={trajectoryName}
              />
            </div>
            {trajectory && (
              <p className="text-slate-400 text-sm mt-1">
                {trajectory.blue_agent_name} vs {trajectory.red_agent_name} — Episode{" "}
                {trajectory.episode}
              </p>
            )}
          </div>
        </header>

        {!trajectory ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
              <p className="text-slate-400">Load a trajectory file to get started</p>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute top-4 right-4 pointer-events-auto">
              <ActionPanel
                step={currentStep}
                totalSteps={trajectory.blue_actions.length}
                blueAction={trajectory.blue_actions[currentStep]}
                redAction={trajectory.red_actions[currentStep]}
                score={trajectory.metric_scores[currentStep]}
              />
            </div>

            <div className="absolute bottom-4 left-4 right-4 max-w-3xl pointer-events-auto">
              <StepControls
                currentStep={currentStep}
                totalSteps={trajectory.blue_actions.length}
                onStepChange={setCurrentStep}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
