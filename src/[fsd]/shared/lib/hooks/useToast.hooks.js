import { useContext, useEffect, useMemo } from 'react';

import { DEFAULT_TOP_POSITION } from '@/[fsd]/shared/lib/constants/toast.constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

export const useToast = (options = {}) => {
  const { topPosition = DEFAULT_TOP_POSITION, icon } = useMemo(() => options, [options]);
  const { toastHandlers, clearToast, setTopPosition, setIcon } = useContext(ToastContext);

  const { toastError, toastSuccess, toastInfo, toastWarning } = useMemo(() => toastHandlers, [toastHandlers]);

  useEffect(() => {
    setTopPosition(topPosition);
    setIcon(icon);
  }, [icon, setIcon, setTopPosition, topPosition]);

  useEffect(() => {
    return () => {
      setTopPosition(DEFAULT_TOP_POSITION);
      setIcon(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    toastError,
    toastSuccess,
    toastInfo,
    toastWarning,
    clearToast,
  };
};
