import { memo, useCallback, useMemo, useState } from 'react';

import { DEFAULT_TOP_POSITION } from '@/[fsd]/shared/lib/constants/toast.constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

const ToastProvider = memo(props => {
  const { children } = props;

  const [topPosition, setTopPosition] = useState(DEFAULT_TOP_POSITION);
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
  }, [onCloseToast]);

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
});

ToastProvider.displayName = 'ToastProvider';

export default ToastProvider;
