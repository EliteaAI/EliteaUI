import { useContext } from 'react';

import { InteractiveTourContext } from './InteractiveTourContext';

export const useInteractiveTour = () => useContext(InteractiveTourContext);
