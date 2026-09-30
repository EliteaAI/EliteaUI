import { createContext, memo, useContext } from 'react';

export const InteractiveTourContext = createContext(null);

export const useInteractiveTour = () => useContext(InteractiveTourContext);

export const InteractiveTourProvider = memo(props => {
  const { value, children } = props;

  return <InteractiveTourContext.Provider value={value}>{children}</InteractiveTourContext.Provider>;
});

InteractiveTourProvider.displayName = 'InteractiveTourProvider';

export default InteractiveTourProvider;
