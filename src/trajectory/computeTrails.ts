import type { AgentAction } from './types';
import type { StepRange } from '../view/RangeSlider';

export type Movement = {
  fromHost: string;
  toHost: string;
  agent: string;
  team: 'blue' | 'red';
  step: number;
};

export const getMovementsInRange = (
  agentActions: Record<string, AgentAction[]>,
  blueAgents: string[],
  redAgents: string[],
  range: StepRange
): Movement[] => {
  const movements: Movement[] = [];
  const blueSet = new Set(blueAgents);

  for (const agentName of [...blueAgents, ...redAgents]) {
    const actions = agentActions[agentName];
    if (!actions) continue;
    const team: 'blue' | 'red' = blueSet.has(agentName) ? 'blue' : 'red';

    // Track last non-empty host to handle gaps (e.g. CC4 blue agents
    // have empty Host on alternating steps).
    let lastHost = '';
    const startLookback = Math.max(0, range.start - 1);
    for (let i = startLookback; i >= 0; i--) {
      if (actions[i]?.Host) {
        lastHost = actions[i].Host;
        break;
      }
    }

    for (let step = range.start; step <= range.end; step++) {
      const host = actions[step]?.Host;
      if (!host) continue;
      if (lastHost && host !== lastHost) {
        movements.push({
          fromHost: lastHost,
          toHost: host,
          agent: agentName,
          team,
          step,
        });
      }
      lastHost = host;
    }
  }

  return movements;
};
