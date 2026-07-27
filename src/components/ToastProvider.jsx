import React, { useCallback, useContext, useMemo, useState } from 'react';

import { useAllToastDurations } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';

import Toast from './Toast';

export const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
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
  const { clearToast, toastProps, topPosition, icon } = useContext(ToastContext);
  const toastDurations = useAllToastDurations();
  const resolvedDuration = toastDurations[toastProps.severity] ?? toastDurations.info;

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
