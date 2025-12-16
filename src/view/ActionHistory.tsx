import { useEffect, useRef } from 'react';
import type { AgentAction } from '../trajectory/types';
import type { StepRange } from './RangeSlider';

type ActionHistoryProps = {
  blueActions: AgentAction[];
  redActions: AgentAction[];
  stepRange: StepRange;
  onStepRangeChange: (range: StepRange) => void;
};

const StatusIndicator = ({ status }: { status: 'TRUE' | 'FALSE' }) => (
  <span className={status === 'TRUE' ? 'text-green-400' : 'text-slate-500'}>
    {status === 'TRUE' ? '✓' : '✗'}
  </span>
);

const ActionCell = ({ action }: { action: AgentAction }) => (
  <div className="flex-1 min-w-0 flex items-start gap-1">
    <StatusIndicator status={action.Status} />
    <div className="min-w-0">
      <div className="text-slate-200 font-medium truncate text-xs">
        {action.Action}
      </div>
      {action.Host && action.Host !== action.Action && (
        <div className="text-slate-300 text-xs truncate">{action.Host}</div>
      )}
    </div>
  </div>
);

export const ActionHistory = ({
  blueActions,
  redActions,
  stepRange,
  onStepRangeChange,
}: ActionHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [stepRange.end]);

  const handleStepClick = (step: number) => {
    if (step < stepRange.start) {
      onStepRangeChange({ start: step, end: step });
    } else {
      onStepRangeChange({ ...stepRange, end: step });
    }
  };

  const allSteps = Array.from({ length: blueActions.length }, (_, i) => i);

  const getRowClass = (step: number): string => {
    const isInRange = step >= stepRange.start && step <= stepRange.end;
    const isEnd = step === stepRange.end;

    if (isEnd) {
      return 'bg-slate-600/80 border-l-2 border-blue-400';
    }
    if (isInRange) {
      return 'bg-slate-700/60 border-l-2 border-slate-500';
    }
    return 'opacity-70 hover:opacity-100 hover:bg-slate-700/50';
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
      <div className="flex gap-2 mb-2 text-sm font-semibold">
        <div className="flex-1 text-blue-400">🔵 BLUE</div>
        <div className="flex-1 text-red-400">🔴 RED</div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 action-history-scroll"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 transparent',
        }}
      >
        {allSteps.map((step) => (
          <div
            key={step}
            ref={step === stepRange.end ? currentRowRef : undefined}
            onClick={() => handleStepClick(step)}
            className={`flex gap-2 py-1.5 px-2 rounded text-xs cursor-pointer ${getRowClass(step)}`}
          >
            <div className="text-slate-500 w-5 shrink-0">{step + 1}</div>
            <ActionCell action={blueActions[step]} />
            <ActionCell action={redActions[step]} />
          </div>
        ))}
      </div>
    </div>
  );
};
