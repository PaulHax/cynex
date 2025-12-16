import type { AgentAction } from './types';
import type { StepRange } from '../view/RangeSlider';

export type Movement = {
  fromHost: string;
  toHost: string;
  agent: 'blue' | 'red';
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
      });
    }

    const prevRed = redActions[prevStep];
    const currRed = redActions[step];
    if (prevRed?.Host && currRed?.Host && prevRed.Host !== currRed.Host) {
      movements.push({
        fromHost: prevRed.Host,
        toHost: currRed.Host,
        agent: 'red',
      });
    }
  }

  return movements;
};
