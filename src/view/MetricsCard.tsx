import type { MetricScore } from "../trajectory/types";

type MetricsCardProps = {
  score?: MetricScore;
};

export const MetricsCard = ({ score }: MetricsCardProps) => {
  if (!score) return null;

  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="font-semibold text-slate-300 text-sm mb-2 text-center">Metrics</div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-xs text-slate-400">C</div>
          <div className="text-lg font-bold text-slate-200">{score.C}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">I</div>
          <div className="text-lg font-bold text-slate-200">{score.I}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">A</div>
          <div className="text-lg font-bold text-slate-200">{score.A}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">R</div>
          <div className="text-lg font-bold text-slate-200">
            {score.Resilience.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};
