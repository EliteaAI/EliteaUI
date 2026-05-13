import { createContext, memo, useContext } from 'react';

const EliteaAssistantContext = createContext(null);

export const EliteaAssistantProvider = memo(props => {
  const { assistantRef, children } = props;

  return <EliteaAssistantContext.Provider value={assistantRef}>{children}</EliteaAssistantContext.Provider>;
});

EliteaAssistantProvider.displayName = 'EliteaAssistantProvider';

export const useEliteaAssistantRef = () => {
  return useContext(EliteaAssistantContext);
};
