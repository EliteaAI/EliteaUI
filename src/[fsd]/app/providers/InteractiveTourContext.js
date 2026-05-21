import { createContext, useContext } from 'react';

export const InteractiveTourContext = createContext(null);

export const useInteractiveTour = () => useContext(InteractiveTourContext);
