import { useState, useEffect } from 'react';
import type { TrajectoryFile } from '../trajectory/types';
import { extractTopology } from './extractTopology';
import { computeLayout, type LayoutResult } from './computeLayout';

type LayoutState = {
  layout: LayoutResult | null;
  forTrajectory: TrajectoryFile | null;
};

export const useNetworkTopology = (
  trajectory: TrajectoryFile | null
): LayoutResult | null => {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    layout: null,
    forTrajectory: null,
  });

  useEffect(() => {
    if (!trajectory) {
      return;
    }

    let cancelled = false;

    const compute = async () => {
      const extracted = extractTopology(trajectory.network_topology);
      const result = await computeLayout(extracted);
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
