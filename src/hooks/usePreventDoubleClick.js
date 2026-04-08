import { useCallback, useState } from 'react';

export default function usePreventDoubleClick() {
  const [actionInProgress, setActionInProgress] = useState(false);

  let actionLock = false;

  const preventDoubleClick = useCallback(
    async action => {
      if (actionInProgress || actionLock) {
        return;
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
      actionLock = true;
      setActionInProgress(true);

      try {
        await action();
      } finally {
        actionLock = false;
        setActionInProgress(false);
      }
    },
    [actionInProgress],
  );

  return preventDoubleClick;
}
