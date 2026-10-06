import { createContext, useContext } from 'react';

export const SelectedChatModelContext = createContext(null);

export const useSelectedChatModelContext = () => useContext(SelectedChatModelContext);
