import type { AgentAction } from "./types";

export type NodeState = "clean" | "compromised";

const COMPROMISE_ACTIONS = new Set([
  "ExploitRemoteService",
  "PrivilegeEscalate",
  "Impact",
]);

const RESTORE_ACTIONS = new Set(["Restore"]);

export const computeNodeStates = (
  blueActions: AgentAction[],
  redActions: AgentAction[],
  upToStep: number
): Map<string, NodeState> => {
  const states = new Map<string, NodeState>();

  for (let step = 0; step <= upToStep; step++) {
    const redAction = redActions[step];
    const blueAction = blueActions[step];

    if (
      redAction?.Status === "TRUE" &&
      COMPROMISE_ACTIONS.has(redAction.Action) &&
      redAction.Host !== redAction.Action
    ) {
      states.set(redAction.Host, "compromised");
    }

    if (
      blueAction?.Status === "TRUE" &&
      RESTORE_ACTIONS.has(blueAction.Action) &&
      blueAction.Host !== blueAction.Action
    ) {
      states.set(blueAction.Host, "clean");
    }
  }

  return states;
};
