import { createContext, useContext } from 'react';

export const InteractiveTourContext = createContext(null);

export const useInteractiveTour = () => useContext(InteractiveTourContext);

export const InteractiveTourProvider = props => {
  const { value, children } = props;

  return <InteractiveTourContext.Provider value={value}>{children}</InteractiveTourContext.Provider>;
};
