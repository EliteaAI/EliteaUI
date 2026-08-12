import { createContext, useContext } from 'react';

export const AgentHubContext = createContext({
  updateApplicationInState: null,
  addToMyLiked: null,
  removeFromMyLiked: null,
});

export const useAgentHubContext = () => {
  return useContext(AgentHubContext);
};
