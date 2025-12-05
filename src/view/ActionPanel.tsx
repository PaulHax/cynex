import type { AgentAction, MetricScore } from "../trajectory/types";
import { MetricsCard } from "./MetricsCard";
import { ActionHistory } from "./ActionHistory";

type ActionPanelProps = {
  currentStep: number;
  totalSteps: number;
  blueActions: AgentAction[];
  redActions: AgentAction[];
  score?: MetricScore;
  onStepChange: (step: number) => void;
};

export const ActionPanel = ({
  currentStep,
  totalSteps,
  blueActions,
  redActions,
  score,
  onStepChange,
}: ActionPanelProps) => (
  <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 w-96 flex flex-col max-h-[calc(100vh-8rem)]">
    <div className="text-lg font-bold text-slate-100 pb-3 text-center">
      Step {currentStep + 1} / {totalSteps}
    </div>

    <div className="mb-3">
      <MetricsCard score={score} />
    </div>

    <ActionHistory
      blueActions={blueActions}
      redActions={redActions}
      currentStep={currentStep}
      onStepChange={onStepChange}
    />
  </div>
);
