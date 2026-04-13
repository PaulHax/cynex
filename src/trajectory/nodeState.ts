import type { StepState } from './types';

export type NodeState = 'clean' | 'user_access' | 'root_access';

export const computeNodeStates = (
  stepStates: StepState[],
  upToStep: number
): Map<string, NodeState> => {
  const states = new Map<string, NodeState>();
  const ss = stepStates[Math.min(upToStep, stepStates.length - 1)];
  if (!ss) return states;

  for (const [host, level] of Object.entries(ss.host_compromise)) {
    if (level === 'PRIVILEGED') states.set(host, 'root_access');
    else if (level === 'USER') states.set(host, 'user_access');
  }

  return states;
};
