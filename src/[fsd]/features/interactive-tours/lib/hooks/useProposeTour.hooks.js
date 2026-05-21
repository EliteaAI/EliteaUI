import { useEffect } from 'react';

import { useInteractiveTour } from '@/[fsd]/app/providers/InteractiveTourProvider';

export const isTourCompleted = tourId =>
  localStorage.getItem(`interactive-tour:${tourId}:completed`) === 'true';

export const useProposeTour = tourId => {
  // Destructure the stable `proposeTour` callback so the effect doesn't re-fire
  // on every context state update (e.g. when the phase transitions to 'running').
  const { proposeTour } = useInteractiveTour() ?? {};

  useEffect(() => {
    if (tourId) proposeTour?.(tourId);
  }, [tourId, proposeTour]);
};
