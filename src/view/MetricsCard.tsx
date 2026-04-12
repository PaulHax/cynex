import type { MetricScore, StepState } from '../trajectory/types';

type MetricsCardProps = {
  score?: MetricScore;
  stepState?: StepState;
  totalHosts?: number;
};

export const MetricsCard = ({
  score,
  stepState,
  totalHosts,
}: MetricsCardProps) => {
  if (!score && !stepState) return null;

  // V2: show mission phase + compromise count
  if (!score && stepState) {
    const compromisedCount = Object.values(stepState.host_compromise).filter(
      (v) => v !== 'NONE'
    ).length;
    return (
      <div className="bg-slate-700/50 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">Status</span>
        <div className="flex items-center gap-4">
          <span>
            <span className="text-slate-400">Phase</span>{' '}
            <span className="font-bold text-slate-200 ml-1">
              {stepState.mission_phase}
            </span>
          </span>
          <span>
            <span className="text-slate-400">Compromised</span>{' '}
            <span className="font-bold text-red-300 ml-1">
              {compromisedCount}
              {totalHosts ? `/${totalHosts}` : ''}
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (!score) return null;

  return (
    <div className="bg-slate-700/50 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
      <span className="font-semibold text-slate-300">Metrics</span>
      <div className="flex items-center gap-4">
        <span>
          <span className="text-slate-400">C</span>{' '}
          <span className="font-bold text-slate-200 ml-1">{score.C}</span>
        </span>
        <span>
          <span className="text-slate-400">I</span>{' '}
          <span className="font-bold text-slate-200 ml-1">{score.I}</span>
        </span>
        <span>
          <span className="text-slate-400">A</span>{' '}
          <span className="font-bold text-slate-200 ml-1">{score.A}</span>
        </span>
        <span>
          <span className="text-slate-400">R</span>{' '}
          <span className="font-bold text-slate-200 ml-1">
            {score.Resilience.toFixed(1)}
          </span>
        </span>
      </div>
    </div>
  );
};
