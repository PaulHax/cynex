import { useState, useEffect } from 'react';
import type { AnyTrajectoryFile } from '../trajectory/types';
import { isV2 } from '../trajectory/types';
import { extractTopology, extractTopologyV2 } from './extractTopology';
import { computeLayout, type LayoutResult } from './computeLayout';

type LayoutState = {
  layout: LayoutResult | null;
  forTrajectory: AnyTrajectoryFile | null;
};

export const useNetworkTopology = (
  trajectory: AnyTrajectoryFile | null
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
      const v2 = isV2(trajectory);
      const extracted = v2
        ? extractTopologyV2(
            trajectory.network_topology,
            trajectory.subnet_metadata
          )
        : extractTopology(trajectory.network_topology);
      const result = await computeLayout(extracted, v2 ? 'DOWN' : 'RIGHT');
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
