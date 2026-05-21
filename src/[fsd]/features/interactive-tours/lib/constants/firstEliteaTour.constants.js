import { conversationTourSteps } from './conversationTour.constants';
import { sidebarTourSteps } from './sidebarTour.constants';

export const FIRST_ELITEA_TOUR_ID = 'first-elitea';

export const FIRST_ELITEA_TOUR_COMPLETION = {
  keepExploring: [],
};

export const firstEliteaTourSteps = [...sidebarTourSteps, ...conversationTourSteps];
