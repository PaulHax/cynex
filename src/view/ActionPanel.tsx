import type { AgentAction, StepState } from '../trajectory/types';
import type { AgentVisibility } from '../App';
import { MetricsCard } from './MetricsCard';
import { ActionHistory } from './ActionHistory';

type ActionPanelProps = {
  currentStep: number;
  totalSteps: number;
  stepState?: StepState;
  onStepChange: (step: number) => void;
  agentVisibility: AgentVisibility;
  onAgentVisibilityChange: (visibility: AgentVisibility) => void;
  agentActions: Record<string, AgentAction[]>;
  blueAgents: string[];
  redAgents: string[];
};

export const ActionPanel = ({
  currentStep,
  totalSteps,
  stepState,
  onStepChange,
  agentVisibility,
  onAgentVisibilityChange,
  agentActions,
  blueAgents,
  redAgents,
}: ActionPanelProps) => (
  <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 w-full h-full flex flex-col">
    <div className="mb-3">
      <MetricsCard stepState={stepState} />
    </div>

    <ActionHistory
      currentStep={currentStep}
      onStepChange={onStepChange}
      agentVisibility={agentVisibility}
      onAgentVisibilityChange={onAgentVisibilityChange}
      agentActions={agentActions}
      blueAgents={blueAgents}
      redAgents={redAgents}
      totalSteps={totalSteps}
    />
  </div>
);
