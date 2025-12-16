import type { AgentAction, MetricScore } from '../trajectory/types';
import type { StepRange } from './RangeSlider';
import type { AgentVisibility } from '../App';
import { MetricsCard } from './MetricsCard';
import { ActionHistory } from './ActionHistory';

type ActionPanelProps = {
  stepRange: StepRange;
  totalSteps: number;
  blueActions: AgentAction[];
  redActions: AgentAction[];
  score?: MetricScore;
  onStepRangeChange: (range: StepRange) => void;
  agentVisibility: AgentVisibility;
  onAgentVisibilityChange: (visibility: AgentVisibility) => void;
};

export const ActionPanel = ({
  stepRange,
  totalSteps,
  blueActions,
  redActions,
  score,
  onStepRangeChange,
  agentVisibility,
  onAgentVisibilityChange,
}: ActionPanelProps) => (
  <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 w-full h-full flex flex-col">
    <div className="text-lg font-bold text-slate-100 pb-3 text-center">
      Steps {stepRange.start + 1} - {stepRange.end + 1} / {totalSteps}
    </div>

    <div className="mb-3">
      <MetricsCard score={score} />
    </div>

    <ActionHistory
      blueActions={blueActions}
      redActions={redActions}
      stepRange={stepRange}
      onStepRangeChange={onStepRangeChange}
      agentVisibility={agentVisibility}
      onAgentVisibilityChange={onAgentVisibilityChange}
    />
  </div>
);
