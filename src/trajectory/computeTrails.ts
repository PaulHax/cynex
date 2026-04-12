import type { AgentAction, AgentActionV2 } from './types';
import type { StepRange } from '../view/RangeSlider';

export type Movement = {
  fromHost: string;
  toHost: string;
  agent: string;
  step: number;
};

export const getMovementsInRange = (
  blueActions: AgentAction[],
  redActions: AgentAction[],
  range: StepRange
): Movement[] => {
  const movements: Movement[] = [];

  for (let step = range.start; step <= range.end; step++) {
    const prevStep = step - 1;
    if (prevStep < 0) continue;

    const prevBlue = blueActions[prevStep];
    const currBlue = blueActions[step];
    if (prevBlue?.Host && currBlue?.Host && prevBlue.Host !== currBlue.Host) {
      movements.push({
        fromHost: prevBlue.Host,
        toHost: currBlue.Host,
        agent: 'blue',
        step,
      });
    }

    const prevRed = redActions[prevStep];
    const currRed = redActions[step];
    if (prevRed?.Host && currRed?.Host && prevRed.Host !== currRed.Host) {
      movements.push({
        fromHost: prevRed.Host,
        toHost: currRed.Host,
        agent: 'red',
        step,
      });
    }
  }

  return movements;
};

/** V2: compute movements from per-agent action arrays (skip green) */
export const getMovementsInRangeV2 = (
  agentActions: Record<string, AgentActionV2[]>,
  blueAgents: string[],
  redAgents: string[],
  range: StepRange
): Movement[] => {
  const movements: Movement[] = [];
  const agents = [...blueAgents, ...redAgents];

  for (const agentName of agents) {
    const actions = agentActions[agentName];
    if (!actions) continue;

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
          step,
        });
      }
    }
  }

  return movements;
};
