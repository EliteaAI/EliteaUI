import { useEffect } from 'react';

import { useInteractiveTour } from '@/[fsd]/app/providers/InteractiveTourProvider';

const getPendingTourKey = tourId => `interactive-tour:${tourId}:pending`;

export const markTourPending = tourId => {
  if (!tourId) return;

  const pendingTourKey = getPendingTourKey(tourId);

  localStorage.setItem(pendingTourKey, 'true');
};

export const useProposeTour = tourId => {
  // Destructure the stable `proposeTour` callback so the effect doesn't re-fire
  // on every context state update (e.g. when the phase transitions to 'running').
  const { proposeTour } = useInteractiveTour() ?? {};

  useEffect(() => {
    if (tourId) proposeTour?.(tourId);
  }, [tourId, proposeTour]);
};

export const useProposePendingTour = tourId => {
  const { proposeTour } = useInteractiveTour() ?? {};

  useEffect(() => {
    if (!tourId) return;

    const pendingTourKey = getPendingTourKey(tourId);
    const isPending = localStorage.getItem(pendingTourKey) === 'true';

    if (!isPending) return;

    localStorage.removeItem(pendingTourKey);
    proposeTour?.(tourId);
  }, [tourId, proposeTour]);
};
