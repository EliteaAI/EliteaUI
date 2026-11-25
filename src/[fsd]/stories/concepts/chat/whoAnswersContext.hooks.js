// Chat concept: what the rows of the «who answers» list need from the list around them — the ⚙ of a
// row opens that participant's settings (version, variables) next to it. Read by ConceptParticipantActions.
import { createContext, useContext } from 'react';

const WhoAnswersContext = createContext({});

export const WhoAnswersProvider = WhoAnswersContext.Provider;

export const useWhoAnswers = () => useContext(WhoAnswersContext);
