import type { MetricScore } from "../trajectory/types";

type MetricsCardProps = {
  score?: MetricScore;
};

export const MetricsCard = ({ score }: MetricsCardProps) => {
  if (!score) return null;

  return (
    <div className="bg-slate-700/50 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
      <span className="font-semibold text-slate-300">Metrics</span>
      <div className="flex items-center gap-4">
        <span><span className="text-slate-400">C</span> <span className="font-bold text-slate-200 ml-1">{score.C}</span></span>
        <span><span className="text-slate-400">I</span> <span className="font-bold text-slate-200 ml-1">{score.I}</span></span>
        <span><span className="text-slate-400">A</span> <span className="font-bold text-slate-200 ml-1">{score.A}</span></span>
        <span><span className="text-slate-400">R</span> <span className="font-bold text-slate-200 ml-1">{score.Resilience.toFixed(1)}</span></span>
      </div>
    </div>
  );
};
