import { useState, useEffect, useCallback } from "react";
import { NetworkGraph } from "./view/NetworkGraph";
import { ActionPanel } from "./view/ActionPanel";
import { StepControls } from "./view/StepControls";
import { TrajectorySelector } from "./view/TrajectorySelector";
import { loadTrajectoryManifest, loadTrajectory } from "./trajectory/loader";
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <header className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-100">Cynex</h1>
          <TrajectorySelector
            onTrajectoryLoad={handleTrajectoryLoad}
            currentName={trajectoryName}
          />
        </div>
        {trajectory && (
          <p className="text-slate-400 text-sm">
            {trajectory.blue_agent_name} vs {trajectory.red_agent_name} — Episode{" "}
            {trajectory.episode}
          </p>
        )}
      </header>

      {!trajectory ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Load a trajectory file to get started</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            <div className="flex-1">
              <NetworkGraph
                currentBlueAction={trajectory.blue_actions[currentStep]}
                currentRedAction={trajectory.red_actions[currentStep]}
                width={800}
                height={400}
              />
            </div>
            <div>
              <ActionPanel
                step={currentStep}
                totalSteps={trajectory.blue_actions.length}
                blueAction={trajectory.blue_actions[currentStep]}
                redAction={trajectory.red_actions[currentStep]}
                score={trajectory.metric_scores[currentStep]}
              />
            </div>
          </div>

          <div className="mt-4 max-w-3xl">
            <StepControls
              currentStep={currentStep}
              totalSteps={trajectory.blue_actions.length}
              onStepChange={setCurrentStep}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
