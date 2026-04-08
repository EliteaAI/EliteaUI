import React, { useCallback, useContext, useMemo, useState } from 'react';

import { useErrorToastDuration } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { TOAST_DURATION } from '@/common/constants';

import Toast from './Toast';

export const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const [autoHideDuration, setAutoHideDuration] = useState(TOAST_DURATION);
  const [topPosition, setTopPosition] = useState('90px');
  const [onCloseToast, setOnCloseToast] = useState(undefined);
  const [icon, setIcon] = useState(undefined);
  const [toastProps, setToastProps] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const openToast = useCallback((severity, message) => {
    setToastProps({ open: true, severity, message });
  }, []);

  const clearToast = useCallback(() => {
    setToastProps(prev => ({ ...prev, message: '', open: false }));
    if (onCloseToast) {
      onCloseToast();
    }
  }, [onCloseToast, setToastProps]);

  const toastHandlers = useMemo(
    () => ({
      toastError: message => openToast('error', message),
      toastSuccess: message => openToast('success', message),
      toastInfo: message => openToast('info', message),
      toastWarning: message => openToast('warning', message),
    }),
    [openToast],
  );

  return (
    <ToastContext.Provider
      value={{
        toastHandlers,
        toastProps,
        autoHideDuration,
        setAutoHideDuration,
        topPosition,
        setTopPosition,
        icon,
        setIcon,
        onCloseToast,
        setOnCloseToast,
        clearToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const ToastComponent = () => {
  const { clearToast, toastProps, autoHideDuration, topPosition, icon } = useContext(ToastContext);
  const errorToastDuration = useErrorToastDuration();
  const resolvedDuration = toastProps.severity === 'error' ? errorToastDuration : autoHideDuration;

  return (
    <Toast
      open={toastProps.open}
      severity={toastProps.severity}
      message={
        typeof toastProps.message === 'string'
          ? toastProps.message
          : toastProps.message?.toString() || 'Unknown error'
      }
      onClose={clearToast}
      autoHideDuration={resolvedDuration}
      topPosition={topPosition}
      icon={icon}
    />
  );
};
