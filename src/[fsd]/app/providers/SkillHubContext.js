import { createContext, useContext } from 'react';

export const SkillHubContext = createContext({
  updateSkillInState: null,
  addToMyLiked: null,
  removeFromMyLiked: null,
});

export const useSkillHubContext = () => {
  return useContext(SkillHubContext);
};
