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

    for (let step = range.start; step <= range.end; step++) {
      const prevStep = step - 1;
      if (prevStep < 0) continue;

      const prev = actions[prevStep];
      const curr = actions[step];
      if (prev?.Host && curr?.Host && prev.Host !== curr.Host) {
        movements.push({
          fromHost: prev.Host,
          toHost: curr.Host,
          agent: agentName,
          team,
          step,
        });
      }
    }
  }

  return movements;
};
