import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { DEFAULT_TOP_POSITION } from '@/[fsd]/shared/lib/constants/toast.constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

const ToastProvider = memo(props => {
  const { children } = props;

  const [topPosition, setTopPosition] = useState(DEFAULT_TOP_POSITION);
  const [onCloseToast, setOnCloseToast] = useState(undefined);
  const [icon, setIcon] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const nextToastIdRef = useRef(0);

  const openToast = useCallback((severity, message) => {
    nextToastIdRef.current += 1;
    const id = nextToastIdRef.current;
    setToasts(prev => [...prev, { id, severity, message, open: true }]);
  }, []);

  // Starts closing the toast with the given id: it fades out and is then removed by clearToast.
  const closeToast = useCallback(id => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, open: false } : toast)));
  }, []);

  // Removes the toast with the given id. Without an id, closes all toasts.
  const clearToast = useCallback(
    id => {
      setToasts(prev => (id === undefined ? [] : prev.filter(toast => toast.id !== id)));
      if (onCloseToast) {
        onCloseToast();
      }
    },
    [onCloseToast],
  );

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
        toasts,
        topPosition,
        setTopPosition,
        icon,
        setIcon,
        onCloseToast,
        setOnCloseToast,
        clearToast,
        closeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
});

ToastProvider.displayName = 'ToastProvider';

export default ToastProvider;
