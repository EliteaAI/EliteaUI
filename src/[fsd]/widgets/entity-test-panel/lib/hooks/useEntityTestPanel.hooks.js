import { useCallback, useState } from 'react';

import { useLocation } from 'react-router-dom';

/**
 * Open state of an editor Test panel. Closed by default, open when a Run History restore is pending.
 */
export const useEntityTestPanel = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => Boolean(location.state?.restoredConversationID));

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, open, close };
};
