import { useEffect } from 'react';

import { useInteractiveTour } from './useInteractiveTour';

export const useProposeTour = tourId => {
  // Destructure the stable `proposeTour` callback so the effect doesn't re-fire
  // on every context state update (e.g. when the phase transitions to 'running').
  const { proposeTour } = useInteractiveTour() ?? {};

  useEffect(() => {
    proposeTour?.(tourId);
  }, [tourId, proposeTour]);
};
