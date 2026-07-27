import { useContext, useEffect, useMemo } from 'react';

import { ToastContext } from '../components/ToastProvider';

const useToast = (options = {}) => {
  const { topPosition = '90px', onCloseToast, icon } = useMemo(() => options, [options]);
  const { toastHandlers, clearToast, setTopPosition, setIcon, setOnCloseToast } = useContext(ToastContext);

  const { toastError, toastSuccess, toastInfo, toastWarning } = useMemo(() => toastHandlers, [toastHandlers]);

  useEffect(() => {
    setTopPosition(topPosition);
    setOnCloseToast(onCloseToast);
    setIcon(icon);
  }, [icon, onCloseToast, setIcon, setOnCloseToast, setTopPosition, topPosition]);

  useEffect(() => {
    return () => {
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
