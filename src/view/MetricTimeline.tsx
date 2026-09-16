import { useMemo, useState } from 'react';
import type { MetricScore, StepState } from '../trajectory/types';
import { EyeIcon } from './EyeIcon';
import { cumulativeRewardAt } from './timelineData';

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

type MetricKey = keyof MetricScore | 'Reward';

type HoveredMetric = {
  key: MetricKey;
  step: number;
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
  if (minimum === maximum) return { minimum: -2, maximum: 2 };

  const targetStep = (maximum - minimum) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const candidates = [1, 2, 2.5, 5, 10, 20, 25, 50].map(
    (factor) => factor * magnitude
  );
  const step =
    candidates.find(
      (candidate) =>
        candidate >= targetStep &&
        Math.ceil(maximum / candidate) - Math.floor(minimum / candidate) <= 4
    ) ?? candidates[candidates.length - 1];
  const lower = Math.floor(minimum / step) * step;
  return { minimum: lower, maximum: lower + 4 * step };
};

const yAt = (value: number, minimum: number, maximum: number): number =>
  PADDING + ((maximum - value) / (maximum - minimum)) * (HEIGHT - 2 * PADDING);

const axisTicks = (minimum: number, maximum: number): number[] =>
  Array.from(
    { length: 5 },
    (_, index) => maximum - (index * (maximum - minimum)) / 4
  );

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

const SeriesLegend = ({
  label,
  color,
  value,
  visible,
  onToggle,
}: {
  label: string;
  color: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
}) => (
  <span className="flex items-center gap-1.5 text-slate-300">
    <button
      type="button"
      aria-label={`${visible ? 'Hide' : 'Show'} ${label} line`}
      aria-pressed={visible}
      title={`${visible ? 'Hide' : 'Show'} ${label} line`}
      onClick={onToggle}
      className="pointer-events-auto shrink-0 cursor-pointer hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
      style={{ color: visible ? color : '#94a3b8' }}
    >
      <EyeIcon visible={visible} className="w-3.5 h-3.5" />
    </button>
    <span className={visible ? '' : 'opacity-50'}>
      {label} {value}
    </span>
  </span>
);

export const MetricTimeline = ({
  scores,
  stepStates,
  currentStep,
  totalSteps,
}: MetricTimelineProps) => {
  const [expanded, setExpanded] = useState(true);
  const [hoveredMetric, setHoveredMetric] = useState<HoveredMetric | null>(
    null
  );
  const [visibleSeries, setVisibleSeries] = useState<
    Record<MetricKey, boolean>
  >({
    C: true,
    I: true,
    A: true,
    Resilience: true,
    Reward: true,
  });
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

  const selectedStep = currentStep;
  const selectedScore = availableScores[selectedStep];
  const selectedReward = rewardValues[selectedStep] ?? null;
  const hasReward = rewardValues.some((value) => value !== null);
  const hasScores = availableScores.length > 0;
  if (!hasScores && !hasReward) return null;
  const selectedX = xAt(selectedStep, totalSteps);
  const zeroY = yAt(0, minimum, maximum);
  const scoreTicks = axisTicks(minimum, maximum);
  const rewardTicks = axisTicks(rewardBounds.minimum, rewardBounds.maximum);
  const hoveredValue =
    hoveredMetric === null
      ? null
      : hoveredMetric.key === 'Reward'
        ? rewardValues[hoveredMetric.step]
        : availableScores[hoveredMetric.step]?.[hoveredMetric.key];
  const hoveredSeries = SERIES.find(({ key }) => key === hoveredMetric?.key);
  const hoveredColor =
    hoveredMetric?.key === 'Reward' ? REWARD_COLOR : hoveredSeries?.color;
  const hoveredLabel =
    hoveredMetric?.key === 'Reward'
      ? 'Cumulative Blue reward'
      : hoveredSeries?.label;
  const hoveredX =
    hoveredMetric === null ? 0 : xAt(hoveredMetric.step, totalSteps);
  const hoveredY =
    hoveredValue === null || hoveredValue === undefined
      ? 0
      : hoveredMetric?.key === 'Reward'
        ? yAt(hoveredValue, rewardBounds.minimum, rewardBounds.maximum)
        : yAt(hoveredValue, minimum, maximum);

  const showHover = (
    key: HoveredMetric['key'],
    clientX: number,
    chart: SVGSVGElement | null
  ) => {
    if (!chart) return;
    const bounds = chart.getBoundingClientRect();
    const position = Math.min(
      1,
      Math.max(0, (clientX - bounds.left) / bounds.width)
    );
    const step = Math.round(position * (totalSteps - 1));
    setHoveredMetric((previous) =>
      previous?.key === key && previous.step === step ? previous : { key, step }
    );
  };

  const toggleSeries = (key: MetricKey) => {
    setVisibleSeries((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
    setHoveredMetric(null);
  };

  return (
    <section
      className="col-span-2 row-start-1 grid grid-cols-subgrid min-w-0 bg-slate-900 pb-2"
      aria-label={
        hasScores
          ? 'CIA and Resilience over time'
          : 'Cumulative Blue reward over time'
      }
      data-testid="metric-timeline"
    >
      <div className="relative col-span-2">
        <button
          type="button"
          aria-label={
            expanded ? 'Collapse metrics graph' : 'Expand metrics graph'
          }
          aria-expanded={expanded}
          aria-controls="metric-timeline-plot"
          onClick={() => {
            setExpanded((previous) => !previous);
            setHoveredMetric(null);
          }}
          className="absolute inset-0 w-full cursor-pointer hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        />
        <div className="relative flex items-center gap-3 px-4 pt-1 text-left text-slate-300 pointer-events-none">
          <span
            aria-hidden="true"
            className="shrink-0 -translate-y-0.5 text-lg leading-none"
          >
            {expanded ? '▾' : '▸'}
          </span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {hasScores &&
              SERIES.map(({ key, label, color }) => (
                <SeriesLegend
                  key={key}
                  label={label}
                  color={color}
                  value={
                    selectedScore ? formatValue(selectedScore[key]) : 'N/A'
                  }
                  visible={visibleSeries[key]}
                  onToggle={() => toggleSeries(key)}
                />
              ))}
            {hasReward && (
              <SeriesLegend
                label="Reward"
                color={REWARD_COLOR}
                value={
                  selectedReward === null ? 'N/A' : formatValue(selectedReward)
                }
                visible={visibleSeries.Reward}
                onToggle={() => toggleSeries('Reward')}
              />
            )}
          </span>
        </div>
      </div>

      {expanded && (
        <div
          id="metric-timeline-plot"
          data-testid="metric-timeline-plot"
          className="col-start-1 min-w-0 pl-4"
        >
          <div className="relative mt-2 h-32">
            {hasScores && (
              <div
                className="absolute right-full mr-2 top-0 bottom-0 w-12 text-right text-xs text-slate-400 pointer-events-none"
                aria-label="CIA and Resilience score scale"
                data-testid="metric-score-axis"
              >
                {scoreTicks.map((value, index) => (
                  <span
                    key={index}
                    className="absolute right-0 -translate-y-1/2"
                    style={{
                      top: `${(yAt(value, minimum, maximum) / HEIGHT) * 100}%`,
                    }}
                  >
                    {formatValue(value)}
                  </span>
                ))}
              </div>
            )}
            {hasReward && visibleSeries.Reward && (
              <div
                className="absolute left-full ml-2 top-0 bottom-0 w-12 text-left text-xs text-rose-300 pointer-events-none"
                aria-label="Cumulative Blue reward scale"
                data-testid="metric-reward-axis"
              >
                {rewardTicks.map((value, index) => (
                  <span
                    key={index}
                    className="absolute left-0 -translate-y-1/2"
                    style={{
                      top: `${(yAt(value, rewardBounds.minimum, rewardBounds.maximum) / HEIGHT) * 100}%`,
                    }}
                  >
                    {formatValue(value)}
                  </span>
                ))}
              </div>
            )}
            <svg
              role="img"
              aria-label={`${hasScores ? 'C, I, A, and Resilience' : ''}${hasScores && hasReward ? ', and ' : ''}${hasReward ? 'cumulative Blue reward' : ''} across ${totalSteps} steps, selected step ${selectedStep + 1}${hasScores && hasReward ? '; reward uses a separate vertical scale' : ''}`}
              data-testid="metric-timeline-chart"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              onPointerLeave={() => setHoveredMetric(null)}
            >
              {hasScores &&
                scoreTicks.map((value, index) => (
                  <line
                    key={index}
                    x1="0"
                    x2={WIDTH}
                    y1={yAt(value, minimum, maximum)}
                    y2={yAt(value, minimum, maximum)}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                ))}
              {hasScores && (
                <line
                  x1="0"
                  x2={WIDTH}
                  y1={zeroY}
                  y2={zeroY}
                  stroke="#64748b"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              )}
              {paths
                .filter(({ key }) => visibleSeries[key])
                .map(({ key, color, path }) => (
                  <path
                    key={key}
                    data-series={key}
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                ))}
              {hasReward && visibleSeries.Reward && (
                <path
                  data-series="Reward"
                  d={totalRewardPath}
                  fill="none"
                  stroke={REWARD_COLOR}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
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
                pointerEvents="none"
              />
              {paths
                .filter(({ key }) => visibleSeries[key])
                .map(({ key, path }) => (
                  <path
                    key={key}
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="stroke"
                    onPointerMove={(event) =>
                      showHover(
                        key,
                        event.clientX,
                        event.currentTarget.ownerSVGElement
                      )
                    }
                    onPointerLeave={() => setHoveredMetric(null)}
                  />
                ))}
              {hasReward && visibleSeries.Reward && (
                <path
                  d={totalRewardPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                  onPointerMove={(event) =>
                    showHover(
                      'Reward',
                      event.clientX,
                      event.currentTarget.ownerSVGElement
                    )
                  }
                  onPointerLeave={() => setHoveredMetric(null)}
                />
              )}
            </svg>
            {hoveredMetric !== null &&
              hoveredValue !== null &&
              hoveredValue !== undefined && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: `${(hoveredX / WIDTH) * 100}%`,
                    top: `${(hoveredY / HEIGHT) * 100}%`,
                  }}
                >
                  <span
                    role="tooltip"
                    data-testid="metric-timeline-tooltip"
                    className={`absolute bottom-2 whitespace-nowrap rounded-sm border border-slate-600 bg-slate-950 px-1.5 py-0.5 text-[10px] leading-none text-slate-100 shadow-sm ${hoveredX / WIDTH < 0.15 ? 'left-0' : hoveredX / WIDTH > 0.85 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
                  >
                    {hoveredLabel} {formatValue(hoveredValue)}
                  </span>
                  <span
                    aria-hidden="true"
                    data-testid="metric-timeline-dot"
                    className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-900"
                    style={{ backgroundColor: hoveredColor }}
                  />
                </div>
              )}
          </div>
        </div>
      )}
    </section>
  );
};
