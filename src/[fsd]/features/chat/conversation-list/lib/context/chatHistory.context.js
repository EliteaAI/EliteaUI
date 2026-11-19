import { createContext } from 'react';

// Lists and flags: changes whenever the history changes
export const ChatHistoryDataContext = createContext(null);

// Setters and refs: stable, so components that only act on the history do not re-render with it
export const ChatHistoryActionsContext = createContext(null);
