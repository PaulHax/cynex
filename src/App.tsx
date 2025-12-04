import { useState, useEffect } from "react";
import { NetworkGraph } from "./view/NetworkGraph";
import { ActionPanel } from "./view/ActionPanel";
import { StepControls } from "./view/StepControls";
import { loadDefaultTrajectory } from "./trajectory/loader";
import type { TrajectoryFile } from "./trajectory/types";

const App = () => {
  const [trajectory, setTrajectory] = useState<TrajectoryFile | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDefaultTrajectory()
      .then(setTrajectory)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!trajectory) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading trajectory...</div>
      </div>
    );
  }

  const totalSteps = trajectory.blue_actions.length;
  const blueAction = trajectory.blue_actions[currentStep];
  const redAction = trajectory.red_actions[currentStep];
  const score = trajectory.metric_scores[currentStep];

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-100">Cynex</h1>
        <p className="text-slate-400 text-sm">
          {trajectory.blue_agent_name} vs {trajectory.red_agent_name} — Episode{" "}
          {trajectory.episode}
        </p>
      </header>

      <div className="flex gap-4">
        <div className="flex-1">
          <NetworkGraph
            currentBlueAction={blueAction}
            currentRedAction={redAction}
            width={800}
            height={400}
          />
        </div>
        <div>
          <ActionPanel
            step={currentStep}
            totalSteps={totalSteps}
            blueAction={blueAction}
            redAction={redAction}
            score={score}
          />
        </div>
      </div>

      <div className="mt-4 max-w-3xl">
        <StepControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          onStepChange={setCurrentStep}
        />
      </div>
    </div>
  );
};

export default App;
