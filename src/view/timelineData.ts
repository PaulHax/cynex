import type { MetricScore, StepState } from '../trajectory/types';

export const cumulativeRewardAt = (
  state: StepState | undefined
): number | null =>
  state ? (Object.values(state.cumulative_reward)[0] ?? null) : null;

export const hasTimelineData = (
  scores: MetricScore[],
  stepStates: StepState[]
): boolean =>
  scores.length > 0 ||
  stepStates.some((state) => cumulativeRewardAt(state) !== null);
