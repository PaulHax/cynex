import { useState, useEffect } from 'react';
import type { Trajectory } from '../trajectory/types';
import { extractTopology } from './extractTopology';
import { computeLayout, type LayoutResult } from './computeLayout';

type LayoutState = {
  layout: LayoutResult | null;
  forTrajectory: Trajectory | null;
};

export const useNetworkTopology = (
  trajectory: Trajectory | null
): LayoutResult | null => {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    layout: null,
    forTrajectory: null,
  });

  useEffect(() => {
    if (!trajectory) return;

    let cancelled = false;

    const compute = async () => {
      const extracted = extractTopology(
        trajectory.networkTopology,
        trajectory.subnetMetadata
      );
      const result = await computeLayout(extracted, trajectory.layoutDirection);
      if (!cancelled) {
        setLayoutState({ layout: result, forTrajectory: trajectory });
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [trajectory]);

  if (!trajectory) return null;
  if (layoutState.forTrajectory !== trajectory) return null;
  return layoutState.layout;
};
