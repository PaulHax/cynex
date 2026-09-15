import type {
  MetricScore,
  RewardBreakdown,
  StepState,
} from '../trajectory/types';

type MetricsCardProps = {
  score?: MetricScore;
  stepState?: StepState;
};

type MetricValueProps = {
  label: string;
  value: number;
  signed?: boolean;
};

const formatMetric = (value: number): string =>
  String(Number(value.toFixed(4)));

const MetricValue = ({ label, value, signed = false }: MetricValueProps) => (
  <span className="whitespace-nowrap">
    <span className="text-slate-400">{label}</span>{' '}
    <span
      className={`font-bold ml-1 ${
        signed
          ? value < 0
            ? 'text-red-300'
            : value > 0
              ? 'text-green-300'
              : 'text-slate-200'
          : 'text-slate-200'
      }`}
    >
      {formatMetric(value)}
    </span>
  </span>
);

const firstValue = (
  values: Record<string, number> | undefined
): number | undefined => (values ? Object.values(values)[0] : undefined);

const rewardBreakdownEntries = (
  breakdown: RewardBreakdown
): [string, number][] =>
  [
    ['RIA', breakdown.ria],
    ['LWF', breakdown.lwf],
    ['ASF', breakdown.asf],
    ['Action cost', breakdown.action_cost],
  ].filter((entry): entry is [string, number] => entry[1] !== undefined);

export const MetricsCard = ({ score, stepState }: MetricsCardProps) => {
  if (!score && !stepState) return null;

  const stepReward = firstValue(stepState?.rewards);
  const cumulativeReward = firstValue(stepState?.cumulative_reward);
  const breakdownEntries = stepState?.reward_breakdown
    ? rewardBreakdownEntries(stepState.reward_breakdown)
    : [];

  return (
    <div
      className="bg-slate-700/50 rounded-lg px-3 py-2 text-sm"
      data-testid="metrics-card"
      aria-label="Step status metrics"
    >
      <div
        className="flex items-center justify-between gap-2 whitespace-nowrap"
        data-testid="primary-metrics"
      >
        {stepState && (
          <MetricValue label="Phase" value={stepState.mission_phase} />
        )}
        {stepReward !== undefined && (
          <MetricValue label="Reward" value={stepReward} signed />
        )}
        {cumulativeReward !== undefined && (
          <MetricValue label="Total" value={cumulativeReward} signed />
        )}
      </div>

      {breakdownEntries.length > 0 && (
        <div
          className="mt-2 pt-2 border-t border-slate-600/70 flex flex-wrap items-center justify-end gap-x-4 gap-y-1"
          data-testid="reward-breakdown"
        >
          {breakdownEntries.map(([label, value]) => (
            <MetricValue key={label} label={label} value={value} signed />
          ))}
        </div>
      )}

      {score && (
        <div
          className="mt-2 pt-2 border-t border-slate-600/70 flex items-center justify-end gap-4"
          data-testid="cia-metrics"
        >
          <MetricValue label="C" value={score.C} />
          <MetricValue label="I" value={score.I} />
          <MetricValue label="A" value={score.A} />
          <MetricValue label="R" value={score.Resilience} />
        </div>
      )}
    </div>
  );
};
