import type { AgentAction, MetricScore, StepState } from '../trajectory/types';
import type { StepRange } from './RangeSlider';
import type { AgentVisibility } from '../App';
import { MetricsCard } from './MetricsCard';
import { ActionHistory } from './ActionHistory';

type ActionPanelProps = {
  stepRange: StepRange;
  totalSteps: number;
  score?: MetricScore;
  stepState?: StepState;
  onStepRangeChange: (range: StepRange) => void;
  agentVisibility: AgentVisibility;
  onAgentVisibilityChange: (visibility: AgentVisibility) => void;
  agentActions: Record<string, AgentAction[]>;
  blueAgents: string[];
  redAgents: string[];
};

export const ActionPanel = ({
  stepRange,
  totalSteps,
  score,
  stepState,
  onStepRangeChange,
  agentVisibility,
  onAgentVisibilityChange,
  agentActions,
  blueAgents,
  redAgents,
}: ActionPanelProps) => (
  <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 w-full h-full flex flex-col">
    <div className="text-lg font-bold text-slate-100 pb-3 text-center">
      Steps {stepRange.start + 1} - {stepRange.end + 1} / {totalSteps}
    </div>

    <div className="mb-3">
      <MetricsCard score={score} stepState={stepState} />
    </div>

    <ActionHistory
      stepRange={stepRange}
      onStepRangeChange={onStepRangeChange}
      agentVisibility={agentVisibility}
      onAgentVisibilityChange={onAgentVisibilityChange}
      agentActions={agentActions}
      blueAgents={blueAgents}
      redAgents={redAgents}
      totalSteps={totalSteps}
    />
  </div>
);
