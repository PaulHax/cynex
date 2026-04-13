import type { MetricScore, StepState } from '../trajectory/types';

type MetricsCardProps = {
  score?: MetricScore;
  stepState?: StepState;
};

export const MetricsCard = ({ score, stepState }: MetricsCardProps) => {
  if (!score && !stepState) return null;

  // Data-driven: show reward metrics when step state has reward data
  const hasRewards = stepState && Object.keys(stepState.rewards).length > 0;

  if (hasRewards) {
    const rewardValues = Object.values(stepState.rewards);
    const stepReward = rewardValues.length > 0 ? rewardValues[0] : 0;
    const cumulativeValues = Object.values(stepState.cumulative_reward);
    const cumulativeReward =
      cumulativeValues.length > 0 ? cumulativeValues[0] : 0;
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
            <span className="text-slate-400">Reward</span>{' '}
            <span
              className={`font-bold ml-1 ${stepReward < 0 ? 'text-red-300' : stepReward > 0 ? 'text-green-300' : 'text-slate-200'}`}
            >
              {stepReward}
            </span>
          </span>
          <span>
            <span className="text-slate-400">Total</span>{' '}
            <span
              className={`font-bold ml-1 ${cumulativeReward < 0 ? 'text-red-300' : cumulativeReward > 0 ? 'text-green-300' : 'text-slate-200'}`}
            >
              {cumulativeReward}
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
