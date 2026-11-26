import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

const { DEFAULT_TOP_POSITION, MAX_TOASTS } = ToastConstants;

const ToastProvider = memo(props => {
  const { children } = props;

  const [topPosition, setTopPosition] = useState(DEFAULT_TOP_POSITION);
  const [icon, setIcon] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const nextToastIdRef = useRef(0);

  const openToast = useCallback((severity, message) => {
    nextToastIdRef.current += 1;
    const toast = { id: nextToastIdRef.current, severity, message, open: true };
    setToasts(prev => [...prev, toast].slice(-MAX_TOASTS));
  }, []);

  // Starts the fade-out of one toast. clearToast removes it once the fade-out has ended.
  const closeToast = useCallback(
    id => setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, open: false } : toast))),
    [],
  );

  // Removes one toast, or all toasts when no id is given.
  const clearToast = useCallback(
    id => setToasts(prev => (id === undefined ? [] : prev.filter(toast => toast.id !== id))),
    [],
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
