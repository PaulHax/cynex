import { useEffect, useRef, memo, useCallback } from 'react';
import type { AgentAction } from '../trajectory/types';
import { resolveEffectiveAction } from '../trajectory/types';
import type { AgentVisibility } from '../App';
import { EyeIcon } from './EyeIcon';

type ActionHistoryProps = {
  currentStep: number;
  onStepChange: (step: number) => void;
  agentVisibility: AgentVisibility;
  onAgentVisibilityChange: (visibility: AgentVisibility) => void;
  agentActions: Record<string, AgentAction[]>;
  blueAgents: string[];
  redAgents: string[];
  totalSteps: number;
};

const StatusIndicator = memo(({ status }: { status: string }) => (
  <span className={status === 'TRUE' ? 'text-green-400' : 'text-slate-500'}>
    {status === 'TRUE' ? '✓' : '✗'}
  </span>
));

const shortAgentName = (name: string): string => {
  const match = name.match(/^(blue|red)_agent_(\d+)$/);
  if (match) return `${match[1][0].toUpperCase()}${match[2]}`;
  return name;
};

type AgentEntry = { agent: string; action: AgentAction; inProgress: boolean };

const AgentActionLine = memo(
  ({
    agent,
    action,
    showLabel,
    inProgress,
  }: {
    agent: string;
    action: AgentAction;
    showLabel: boolean;
    inProgress: boolean;
  }) => (
    <div
      className={`flex items-start gap-1 min-w-0 ${inProgress ? 'opacity-60' : ''}`}
    >
      <StatusIndicator status={action.Status} />
      {showLabel && (
        <span className="text-slate-400 shrink-0">{shortAgentName(agent)}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-slate-200 font-medium text-xs truncate">
          {action.Action}
          {inProgress && <span className="text-slate-400">&hellip;</span>}
        </div>
        {action.Host && (
          <div className="text-slate-300 text-xs truncate">{action.Host}</div>
        )}
      </div>
    </div>
  )
);

const ActionRow = memo(
  ({
    step,
    blueEntries,
    redEntries,
    isCurrent,
    onStepClick,
    showAgentLabels,
    rowRef,
  }: {
    step: number;
    blueEntries: AgentEntry[];
    redEntries: AgentEntry[];
    isCurrent: boolean;
    onStepClick: (step: number) => void;
    showAgentLabels: boolean;
    rowRef?: React.RefObject<HTMLDivElement | null>;
  }) => {
    const className = isCurrent
      ? 'bg-slate-600/80 border-l-2 border-blue-400'
      : 'opacity-70 hover:opacity-100 hover:bg-slate-700/50';

    const handleClick = useCallback(() => {
      onStepClick(step);
    }, [onStepClick, step]);

    return (
      <div
        ref={rowRef}
        onClick={handleClick}
        className={`flex gap-2 py-1.5 px-2 rounded text-xs cursor-pointer ${className}`}
      >
        <div className="text-slate-500 w-5 shrink-0">{step + 1}</div>
        <div className="flex-1 min-w-0 space-y-0.5">
          {blueEntries.length > 0 ? (
            blueEntries.map((e) => (
              <AgentActionLine
                key={e.agent}
                agent={e.agent}
                action={e.action}
                showLabel={showAgentLabels}
                inProgress={e.inProgress}
              />
            ))
          ) : (
            <span className="text-slate-600 italic">Sleep</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          {redEntries.length > 0 ? (
            redEntries.map((e) => (
              <AgentActionLine
                key={e.agent}
                agent={e.agent}
                action={e.action}
                showLabel={showAgentLabels}
                inProgress={e.inProgress}
              />
            ))
          ) : (
            <span className="text-slate-600 italic">Sleep</span>
          )}
        </div>
      </div>
    );
  }
);

export const ActionHistory = ({
  currentStep,
  onStepChange,
  agentVisibility,
  onAgentVisibilityChange,
  agentActions,
  blueAgents,
  redAgents,
  totalSteps,
}: ActionHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  const showAgentLabels = blueAgents.length > 1 || redAgents.length > 1;

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [currentStep]);

  const handleStepClick = useCallback(
    (step: number) => {
      onStepChange(step);
    },
    [onStepChange]
  );

  const getEntries = (agents: string[], step: number): AgentEntry[] => {
    const entries: AgentEntry[] = [];
    for (const agent of agents) {
      const actions = agentActions[agent];
      if (!actions) continue;
      const resolved = resolveEffectiveAction(actions, step);
      if (resolved) {
        entries.push({
          agent,
          action: resolved.action,
          inProgress: resolved.inProgress,
        });
      }
    }
    return entries;
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex gap-2 mb-2 text-sm font-semibold">
        <div className="flex-1 flex items-center gap-1.5 text-blue-400">
          <span>BLUE</span>
          <button
            onClick={() =>
              onAgentVisibilityChange({
                ...agentVisibility,
                blue: !agentVisibility.blue,
              })
            }
            className={`p-1.5 rounded bg-slate-700 hover:bg-slate-600 transition-colors ${agentVisibility.blue ? '' : 'opacity-50'}`}
            title={agentVisibility.blue ? 'Hide blue agent' : 'Show blue agent'}
          >
            <EyeIcon visible={agentVisibility.blue} />
          </button>
        </div>
        <div className="flex-1 flex items-center gap-1.5 text-red-400">
          <span>RED</span>
          <button
            onClick={() =>
              onAgentVisibilityChange({
                ...agentVisibility,
                red: !agentVisibility.red,
              })
            }
            className={`p-1.5 rounded bg-slate-700 hover:bg-slate-600 transition-colors ${agentVisibility.red ? '' : 'opacity-50'}`}
            title={agentVisibility.red ? 'Hide red agent' : 'Show red agent'}
          >
            <EyeIcon visible={agentVisibility.red} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 action-history-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 transparent',
        }}
      >
        {Array.from({ length: totalSteps }, (_, step) => (
          <ActionRow
            key={step}
            step={step}
            blueEntries={getEntries(blueAgents, step)}
            redEntries={getEntries(redAgents, step)}
            isCurrent={step === currentStep}
            onStepClick={handleStepClick}
            showAgentLabels={showAgentLabels}
            rowRef={step === currentStep ? currentRowRef : undefined}
          />
        ))}
      </div>
    </div>
  );
};
