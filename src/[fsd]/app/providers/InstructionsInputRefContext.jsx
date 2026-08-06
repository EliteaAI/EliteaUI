import React, { memo, useContext } from 'react';

const InstructionsInputRefContext = React.createContext();

/**
 * Provider component for instructions input reference management
 */
export const InstructionsInputRefProvider = memo(props => {
  const { inputRef, children } = props;
  return (
    <InstructionsInputRefContext.Provider value={inputRef}>{children}</InstructionsInputRefContext.Provider>
  );
});

InstructionsInputRefProvider.displayName = 'InstructionsInputRefProvider';

/**
 * Hook to access instructions input reference context
 */
export const useInstructionsInputRefContext = () => {
  return useContext(InstructionsInputRefContext);
};
