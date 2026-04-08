import { useContext, useEffect, useMemo } from 'react';

import { TOAST_DURATION } from '@/common/constants';

import { ToastContext } from '../components/ToastProvider';

const useToast = (options = {}) => {
  const {
    autoHideDuration = TOAST_DURATION,
    topPosition = '90px',
    onCloseToast,
    icon,
  } = useMemo(() => options, [options]);
  const { toastHandlers, clearToast, setAutoHideDuration, setTopPosition, setIcon, setOnCloseToast } =
    useContext(ToastContext);

  const { toastError, toastSuccess, toastInfo, toastWarning } = useMemo(() => toastHandlers, [toastHandlers]);

  useEffect(() => {
    setAutoHideDuration(autoHideDuration);
    setTopPosition(topPosition);
    setOnCloseToast(onCloseToast);
    setIcon(icon);
  }, [
    autoHideDuration,
    icon,
    onCloseToast,
    setAutoHideDuration,
    setIcon,
    setOnCloseToast,
    setTopPosition,
    topPosition,
  ]);

  useEffect(() => {
    return () => {
      setAutoHideDuration(TOAST_DURATION);
      setTopPosition('90px');
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
