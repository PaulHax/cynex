import type { AgentAction } from "./types";

export type NodeState = "clean" | "user_access" | "root_access";

const USER_ACCESS_ACTIONS = new Set(["ExploitRemoteService"]);
const ROOT_ACCESS_ACTIONS = new Set(["PrivilegeEscalate", "Impact"]);
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

    if (redAction?.Status === "TRUE" && redAction.Host !== redAction.Action) {
      if (USER_ACCESS_ACTIONS.has(redAction.Action)) {
        states.set(redAction.Host, "user_access");
      } else if (ROOT_ACCESS_ACTIONS.has(redAction.Action)) {
        states.set(redAction.Host, "root_access");
      }
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
