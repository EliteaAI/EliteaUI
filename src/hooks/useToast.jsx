import { useContext, useEffect, useMemo } from 'react';

import { DEFAULT_TOP_POSITION } from '@/[fsd]/shared/lib/constants/toast.constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

const useToast = (options = {}) => {
  const { topPosition = DEFAULT_TOP_POSITION, onCloseToast, icon } = useMemo(() => options, [options]);
  const { toastHandlers, clearToast, setTopPosition, setIcon, setOnCloseToast } = useContext(ToastContext);

  const { toastError, toastSuccess, toastInfo, toastWarning } = useMemo(() => toastHandlers, [toastHandlers]);

  useEffect(() => {
    setTopPosition(topPosition);
    setOnCloseToast(onCloseToast);
    setIcon(icon);
  }, [icon, onCloseToast, setIcon, setOnCloseToast, setTopPosition, topPosition]);

  useEffect(() => {
    return () => {
      setTopPosition(DEFAULT_TOP_POSITION);
      setOnCloseToast(undefined);
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

export default useToast;
