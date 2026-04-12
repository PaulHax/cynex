import type { AgentAction, StepState } from './types';

export type NodeState = 'clean' | 'user_access' | 'root_access';

// Red agent starts on User0 with SYSTEM (root) access via phishing
const INITIAL_RED_STATE: Record<string, NodeState> = {
  User0: 'root_access',
};

const USER_ACCESS_ACTIONS = new Set(['ExploitRemoteService']);
const ROOT_ACCESS_ACTIONS = new Set(['PrivilegeEscalate', 'Impact']);
const RESTORE_ACTIONS = new Set(['Restore']);

export const computeNodeStates = (
  blueActions: AgentAction[],
  redActions: AgentAction[],
  upToStep: number
): Map<string, NodeState> => {
  // Initialize with red's starting position (not captured in trajectory actions)
  const states = new Map<string, NodeState>(Object.entries(INITIAL_RED_STATE));

  for (let step = 0; step <= upToStep; step++) {
    const redAction = redActions[step];
    const blueAction = blueActions[step];

    if (redAction?.Status === 'TRUE' && redAction.Host !== redAction.Action) {
      if (USER_ACCESS_ACTIONS.has(redAction.Action)) {
        states.set(redAction.Host, 'user_access');
      } else if (ROOT_ACCESS_ACTIONS.has(redAction.Action)) {
        states.set(redAction.Host, 'root_access');
      }
    }

    if (
      blueAction?.Status === 'TRUE' &&
      RESTORE_ACTIONS.has(blueAction.Action) &&
      blueAction.Host !== blueAction.Action
    ) {
      states.set(blueAction.Host, 'clean');
    }
  }

  return states;
};

/** V2: read authoritative host_compromise from step_states */
export const computeNodeStatesV2 = (
  stepStates: StepState[],
  upToStep: number
): Map<string, NodeState> => {
  const states = new Map<string, NodeState>();
  const ss = stepStates[Math.min(upToStep, stepStates.length - 1)];
  if (!ss) return states;

  for (const [host, level] of Object.entries(ss.host_compromise)) {
    if (level === 'PRIVILEGED') states.set(host, 'root_access');
    else if (level === 'USER') states.set(host, 'user_access');
    // NONE -> not in map (clean)
  }

  return states;
};
