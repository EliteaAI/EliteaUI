import { useEffect, useRef } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useInteractiveTour } from '@/[fsd]/app/providers/InteractiveTourProvider';

export const useTourFromUrl = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { startTour } = useInteractiveTour() ?? {};
  const consumedTourRef = useRef(null);

  useEffect(() => {
    const tourId = searchParams.get('tour');

    if (!tourId) {
      consumedTourRef.current = null;
      return;
    }

    if (consumedTourRef.current === tourId) return;

    consumedTourRef.current = tourId;
    startTour?.(tourId);
    setSearchParams(
      params => {
        const nextParams = new URLSearchParams(params);

        nextParams.delete('tour');

        return nextParams;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, startTour]);
};
