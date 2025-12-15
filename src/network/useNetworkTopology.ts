import { useState, useEffect } from "react";
import type { TrajectoryFile } from "../trajectory/types";
import { extractTopology } from "./extractTopology";
import { computeLayout, type LayoutResult } from "./computeLayout";

export const useNetworkTopology = (
  trajectory: TrajectoryFile | null
): LayoutResult | null => {
  const [layout, setLayout] = useState<LayoutResult | null>(null);

  useEffect(() => {
    if (!trajectory) {
      setLayout(null);
      return;
    }

    const compute = async () => {
      const extracted = extractTopology(trajectory.network_topology);
      const result = await computeLayout(extracted);
      setLayout(result);
    };

    compute();
  }, [trajectory]);

  return layout;
};
