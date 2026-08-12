import { memo } from 'react';

import { TOUR_COMPLETION_CONFIGS } from '@/[fsd]/features/interactive-tours/lib/helpers';
import { useInteractiveTour } from '@/[fsd]/shared/lib/context';

import FirstVisitPrompt from './FirstVisitPrompt';
import InteractiveTourCard from './InteractiveTourCard';
import TourCompleteCard from './TourCompleteCard';

const InteractiveTourRoot = memo(() => {
  const { phase, currentStep, tourId, dismissPrompt, startTour } = useInteractiveTour();

  if (phase === 'prompt') {
    return (
      <FirstVisitPrompt
        onSkip={dismissPrompt}
        onStart={() => startTour(tourId)}
      />
    );
  }

  if (phase === 'running' && currentStep) {
    return <InteractiveTourCard />;
  }

  if (phase === 'complete') {
    return <TourCompleteCard keepExploring={TOUR_COMPLETION_CONFIGS[tourId]?.keepExploring ?? []} />;
  }

  return null;
});

InteractiveTourRoot.displayName = 'InteractiveTourRoot';

export default InteractiveTourRoot;
