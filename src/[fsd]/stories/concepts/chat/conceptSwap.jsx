// Which parts of the team's chat screen a concept story replaces. The switches in ./swaps render the team's component
// unless a story wraps the screen in <ConceptSwapProvider value={{ ... }}>. See CONCEPT_SWAPS in .storybook/main.js.
import { createContext, useContext } from 'react';

const ConceptSwapContext = createContext({});

export const ConceptSwapProvider = ConceptSwapContext.Provider;

export const useConceptSwap = () => useContext(ConceptSwapContext);
