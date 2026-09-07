import { useCallback, useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

export const useRestoredConversation = () => {
  const location = useLocation();
  const [restoredConversationID, setRestoredConversationID] = useState(null);

  useEffect(() => {
    if (location.state?.restoredConversationID) {
      setRestoredConversationID(location.state.restoredConversationID);
      window.history.replaceState({ ...window.history.state, usr: null }, '', window.location.href);
    }
  }, [location.state]);

  const onRestoreConversationComplete = useCallback(() => {
    setRestoredConversationID(null);
  }, []);

  return { restoredConversationID, onRestoreConversationComplete };
};
