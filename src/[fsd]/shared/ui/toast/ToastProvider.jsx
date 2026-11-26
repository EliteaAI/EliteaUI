import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { DEFAULT_TOP_POSITION } from '@/[fsd]/shared/lib/constants/toast.constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

const ToastProvider = memo(props => {
  const { children } = props;

  const [topPosition, setTopPosition] = useState(DEFAULT_TOP_POSITION);
  const [icon, setIcon] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const nextToastIdRef = useRef(0);

  // The callback set by the page through useToast. It lives in a ref so that a toast created in the same commit
  // as the callback (the delete buttons set it and open a toast in consecutive effects) never gets a stale one.
  const currentOnCloseToastRef = useRef(undefined);
  // The callback of every toast that is still shown, by toast id. A toast runs only its own callback.
  const onCloseCallbacksRef = useRef(new Map());

  const setOnCloseToast = useCallback(onCloseToast => {
    currentOnCloseToastRef.current = onCloseToast;

    // useToast clears the callback when its page unmounts. The pending toasts must not run their callbacks
    // afterwards, for example to navigate away from a page that is not shown anymore.
    if (!onCloseToast) {
      onCloseCallbacksRef.current.clear();
    }
  }, []);

  const openToast = useCallback((severity, message) => {
    nextToastIdRef.current += 1;
    const id = nextToastIdRef.current;
    if (currentOnCloseToastRef.current) {
      onCloseCallbacksRef.current.set(id, currentOnCloseToastRef.current);
    }
    setToasts(prev => [...prev, { id, severity, message, open: true }]);
  }, []);

  // Starts closing the toast with the given id: it fades out and is then removed by clearToast.
  const closeToast = useCallback(id => {
    setToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, open: false } : toast)));
  }, []);

  // Removes the toast with the given id and runs its own callback. Without an id, removes all toasts and runs
  // their callbacks.
  const clearToast = useCallback(id => {
    const callbacks = onCloseCallbacksRef.current;
    const idsToRun = id === undefined ? [...callbacks.keys()] : [id];

    setToasts(prev => (id === undefined ? [] : prev.filter(toast => toast.id !== id)));

    idsToRun.forEach(toastId => {
      const callback = callbacks.get(toastId);
      callbacks.delete(toastId);
      callback?.();
    });
  }, []);

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
