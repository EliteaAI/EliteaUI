import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ToolkitSocketConstants } from '@/[fsd]/shared/lib/constants';

/**
 * Context for managing toolkit socket session state.
 * This helps coordinate between different consumers (auth check vs chat)
 * to prevent message interference.
 */
const ToolkitSocketContext = createContext({
  activeSession: null,
  sessionType: ToolkitSocketConstants.ToolkitSocketSessionType.NONE,
  startSession: () => {},
  endSession: () => {},
  isAuthCheckSession: false,
  isChatSession: false,
});

/**
 * Provider component for toolkit socket session management
 */
export const ToolkitSocketProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionType, setSessionType] = useState(ToolkitSocketConstants.ToolkitSocketSessionType.NONE);

  const startSession = useCallback((conversationUuid, type) => {
    setActiveSession(conversationUuid);
    setSessionType(type);
  }, []);

  const endSession = useCallback(() => {
    setActiveSession(null);
    setSessionType(ToolkitSocketConstants.ToolkitSocketSessionType.NONE);
  }, []);

  const isAuthCheckSession = useMemo(
    () => sessionType === ToolkitSocketConstants.ToolkitSocketSessionType.AUTH_CHECK,
    [sessionType],
  );

  const isChatSession = useMemo(
    () => sessionType === ToolkitSocketConstants.ToolkitSocketSessionType.CHAT,
    [sessionType],
  );
  const value = useMemo(
    () => ({
      activeSession,
      sessionType,
      startSession,
      endSession,
      isAuthCheckSession,
      isChatSession,
    }),
    [activeSession, sessionType, startSession, endSession, isAuthCheckSession, isChatSession],
  );

  return <ToolkitSocketContext.Provider value={value}>{children}</ToolkitSocketContext.Provider>;
};

/**
 * Hook to access toolkit socket session context
 */
export const useToolkitSocketContext = () => {
  return useContext(ToolkitSocketContext);
};
