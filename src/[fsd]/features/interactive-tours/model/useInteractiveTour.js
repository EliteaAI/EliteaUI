import { useContext } from 'react';

import { InteractiveTourContext } from '@/[fsd]/app/providers/InteractiveTourContext';

export const useInteractiveTour = () => useContext(InteractiveTourContext);
