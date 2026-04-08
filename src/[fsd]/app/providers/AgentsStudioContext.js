import { createContext, useContext } from 'react';

export const AgentsStudioContext = createContext({
  updateApplicationInState: null,
  addToMyLiked: null,
  removeFromMyLiked: null,
});

export const useAgentsStudioContext = () => {
  return useContext(AgentsStudioContext);
};
