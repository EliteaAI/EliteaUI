import { createContext, useContext } from 'react';

// Set by a page that owns the list's filter panel (section pages): whether the panel is open, where it starts
// and that the search lives in the page toolbar. Without a provider the list keeps its own layout.
export const ListLayoutContext = createContext(null);

export const useListLayout = () => useContext(ListLayoutContext);
