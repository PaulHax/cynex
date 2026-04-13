import { useEffect, useRef, memo, useCallback } from 'react';
import type { AgentAction } from '../trajectory/types';
import type { StepRange } from './RangeSlider';
import type { AgentVisibility } from '../App';

type ActionHistoryProps = {
  stepRange: StepRange;
  onStepRangeChange: (range: StepRange) => void;
  agentVisibility: AgentVisibility;
  onAgentVisibilityChange: (visibility: AgentVisibility) => void;
  agentActions: Record<string, AgentAction[]>;
  blueAgents: string[];
  redAgents: string[];
  totalSteps: number;
};

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {visible ? (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </>
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    )}
  </svg>
);

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

type AgentEntry = { agent: string; action: AgentAction };

const AgentActionLine = memo(
  ({
    agent,
    action,
    showLabel,
  }: {
    agent: string;
    action: AgentAction;
    showLabel: boolean;
  }) => (
    <div className="flex items-start gap-1 min-w-0">
      <StatusIndicator status={action.Status} />
      {showLabel && (
        <span className="text-slate-400 shrink-0">{shortAgentName(agent)}</span>
      )}
      <div className="min-w-0">
        <span className="text-slate-200 font-medium text-xs truncate">
          {action.Action}
        </span>
        {action.Host && (
          <div className="text-slate-300 text-xs truncate">{action.Host}</div>
        )}
      </div>
    </div>
  )
);

type RowState = 'end' | 'inRange' | 'outOfRange';

const ActionRow = memo(
  ({
    step,
    blueEntries,
    redEntries,
    rowState,
    onStepClick,
    showAgentLabels,
    rowRef,
  }: {
    step: number;
    blueEntries: AgentEntry[];
    redEntries: AgentEntry[];
    rowState: RowState;
    onStepClick: (step: number) => void;
    showAgentLabels: boolean;
    rowRef?: React.RefObject<HTMLDivElement | null>;
  }) => {
    const className =
      rowState === 'end'
        ? 'bg-slate-600/80 border-l-2 border-blue-400'
        : rowState === 'inRange'
          ? 'bg-slate-700/60 border-l-2 border-slate-500'
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
  stepRange,
  onStepRangeChange,
  agentVisibility,
  onAgentVisibilityChange,
  agentActions,
  blueAgents,
  redAgents,
  totalSteps,
}: ActionHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);
  const stepRangeRef = useRef(stepRange);
  const onStepRangeChangeRef = useRef(onStepRangeChange);

  // Show agent name labels when any team has multiple agents
  const showAgentLabels = blueAgents.length > 1 || redAgents.length > 1;

  useEffect(() => {
    stepRangeRef.current = stepRange;
  }, [stepRange]);

  useEffect(() => {
    onStepRangeChangeRef.current = onStepRangeChange;
  }, [onStepRangeChange]);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [stepRange.end]);

  const handleStepClick = useCallback((step: number) => {
    const currentRange = stepRangeRef.current;
    if (step < currentRange.start) {
      onStepRangeChangeRef.current({ start: step, end: step });
    } else {
      onStepRangeChangeRef.current({ ...currentRange, end: step });
    }
  }, []);

  const getRowState = (step: number): RowState => {
    if (step === stepRange.end) return 'end';
    if (step >= stepRange.start && step <= stepRange.end) return 'inRange';
    return 'outOfRange';
  };

  const getEntries = (agents: string[], step: number): AgentEntry[] => {
    const entries: AgentEntry[] = [];
    for (const agent of agents) {
      const a = agentActions[agent]?.[step];
      if (a && a.Action !== 'Sleep') {
        entries.push({ agent, action: a });
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
            rowState={getRowState(step)}
            onStepClick={handleStepClick}
            showAgentLabels={showAgentLabels}
            rowRef={step === stepRange.end ? currentRowRef : undefined}
          />
        ))}
      </div>
    </div>
  );
};
