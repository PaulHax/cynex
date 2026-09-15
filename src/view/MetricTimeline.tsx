import { useMemo, useState } from 'react';
import type { MetricScore, StepState } from '../trajectory/types';

type MetricTimelineProps = {
  scores: MetricScore[];
  stepStates: StepState[];
  currentStep: number;
  totalSteps: number;
};

type Series = {
  key: keyof MetricScore;
  label: string;
  color: string;
};

const SERIES: Series[] = [
  { key: 'C', label: 'Confidentiality', color: '#67e8f9' },
  { key: 'I', label: 'Integrity', color: '#fbbf24' },
  { key: 'A', label: 'Availability', color: '#c4b5fd' },
  { key: 'Resilience', label: 'Resilience', color: '#86efac' },
];
const REWARD_COLOR = '#fb7185';

const WIDTH = 1000;
const HEIGHT = 120;
const PADDING = 8;

const formatValue = (value: number): string => String(Number(value.toFixed(2)));

const xAt = (step: number, length: number): number =>
  length <= 1 ? 0 : (step / (length - 1)) * WIDTH;

const plotBounds = (values: number[]) => {
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const padding = Math.max((maximum - minimum) * 0.08, 1);
  return { minimum: minimum - padding, maximum: maximum + padding };
};

const yAt = (value: number, minimum: number, maximum: number): number =>
  PADDING + ((maximum - value) / (maximum - minimum)) * (HEIGHT - 2 * PADDING);

const seriesPath = (
  scores: MetricScore[],
  key: keyof MetricScore,
  totalSteps: number,
  minimum: number,
  maximum: number
): string =>
  scores
    .map(
      (score, step) =>
        `${step === 0 ? 'M' : 'L'} ${xAt(step, totalSteps)} ${yAt(score[key], minimum, maximum)}`
    )
    .join(' ');

const rewardPath = (
  values: (number | null)[],
  totalSteps: number,
  minimum: number,
  maximum: number
): string => {
  let isConnected = false;
  return values
    .map((value, step) => {
      if (value === null) {
        isConnected = false;
        return '';
      }
      const command = isConnected ? 'L' : 'M';
      isConnected = true;
      return `${command} ${xAt(step, totalSteps)} ${yAt(value, minimum, maximum)}`;
    })
    .filter(Boolean)
    .join(' ');
};

const cumulativeRewardAt = (state: StepState | undefined): number | null =>
  state ? (Object.values(state.cumulative_reward)[0] ?? null) : null;

export const MetricTimeline = ({
  scores,
  stepStates,
  currentStep,
  totalSteps,
}: MetricTimelineProps) => {
  const [expanded, setExpanded] = useState(true);
  const availableScores = useMemo(
    () => scores.slice(0, totalSteps),
    [scores, totalSteps]
  );
  const rewardValues = useMemo(
    () =>
      Array.from({ length: totalSteps }, (_, step) =>
        cumulativeRewardAt(stepStates[step])
      ),
    [stepStates, totalSteps]
  );
  const { minimum, maximum, paths, rewardBounds, totalRewardPath } =
    useMemo(() => {
      const bounds = plotBounds(
        availableScores.flatMap((score) => SERIES.map(({ key }) => score[key]))
      );
      const rewardBounds = plotBounds(
        rewardValues.filter((value): value is number => value !== null)
      );
      return {
        ...bounds,
        rewardBounds,
        totalRewardPath: rewardPath(
          rewardValues,
          totalSteps,
          rewardBounds.minimum,
          rewardBounds.maximum
        ),
        paths: SERIES.map((series) => ({
          ...series,
          path: seriesPath(
            availableScores,
            series.key,
            totalSteps,
            bounds.minimum,
            bounds.maximum
          ),
        })),
      };
    }, [availableScores, rewardValues, totalSteps]);

  if (availableScores.length === 0) return null;

  const selectedStep = currentStep;
  const selectedScore = availableScores[selectedStep];
  const selectedReward = rewardValues[selectedStep] ?? null;
  const hasReward = rewardValues.some((value) => value !== null);
  const selectedX = xAt(selectedStep, totalSteps);
  const zeroY = yAt(0, minimum, maximum);
  const rewardZeroY = yAt(0, rewardBounds.minimum, rewardBounds.maximum);

  return (
    <section
      className="bg-slate-900 py-2"
      aria-label="CIA and Resilience over time"
      data-testid="metric-timeline"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={
            expanded ? 'Collapse metrics graph' : 'Expand metrics graph'
          }
          aria-expanded={expanded}
          aria-controls="metric-timeline-plot"
          onClick={() => setExpanded((previous) => !previous)}
          className="text-lg leading-none text-slate-300 hover:text-white cursor-pointer shrink-0"
        >
          <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        </button>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
          {SERIES.map(({ key, label, color }) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-slate-300"
            >
              <span
                className="inline-block w-3 h-0.5"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              {label} {selectedScore ? formatValue(selectedScore[key]) : 'N/A'}
            </span>
          ))}
          {hasReward && (
            <span
              className="flex items-center gap-1.5 text-slate-300"
              title="Cumulative Blue reward uses the right vertical scale"
            >
              <span
                className="inline-block w-3 h-0.5"
                style={{ backgroundColor: REWARD_COLOR }}
                aria-hidden="true"
              />
              Reward total{' '}
              {selectedReward === null ? 'N/A' : formatValue(selectedReward)}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div id="metric-timeline-plot" data-testid="metric-timeline-plot">
          <div className="relative mt-2 h-32">
            <div className="absolute right-full mr-2 top-0 bottom-0 text-right text-xs text-slate-500 w-12">
              <span className="absolute right-0 top-0">
                {formatValue(maximum)}
              </span>
              <span
                className="absolute right-0"
                style={{ top: `${(zeroY / HEIGHT) * 100}%` }}
              >
                0
              </span>
              <span className="absolute right-0 bottom-0">
                {formatValue(minimum)}
              </span>
            </div>
            {hasReward && (
              <div className="absolute right-1 top-0 bottom-0 z-10 text-right text-xs text-rose-300 pointer-events-none">
                <span className="absolute right-0 top-0">
                  {formatValue(rewardBounds.maximum)}
                </span>
                <span
                  className="absolute right-0"
                  style={{ top: `${(rewardZeroY / HEIGHT) * 100}%` }}
                >
                  0
                </span>
                <span className="absolute right-0 bottom-0">
                  {formatValue(rewardBounds.minimum)}
                </span>
              </div>
            )}
            <svg
              role="img"
              aria-label={`C, I, A, and Resilience${hasReward ? ', and cumulative Blue reward' : ''} across ${totalSteps} steps, selected step ${selectedStep + 1}${hasReward ? '; reward uses a separate vertical scale' : ''}`}
              data-testid="metric-timeline-chart"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
            >
              <line
                x1="0"
                x2={WIDTH}
                y1={zeroY}
                y2={zeroY}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="5 5"
                vectorEffect="non-scaling-stroke"
              />
              {paths.map(({ key, color, path }) => (
                <path
                  key={key}
                  data-series={key}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {hasReward && (
                <path
                  data-series="Reward"
                  d={totalRewardPath}
                  fill="none"
                  stroke={REWARD_COLOR}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <line
                data-testid="metric-timeline-marker"
                x1={selectedX}
                x2={selectedX}
                y1="0"
                y2={HEIGHT}
                stroke="#e2e8f0"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>1</span>
            <span>{totalSteps}</span>
          </div>
        </div>
      )}
    </section>
  );
};
