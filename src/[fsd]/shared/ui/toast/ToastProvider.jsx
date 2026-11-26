import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

const { DEFAULT_TOP_POSITION, MAX_TOASTS } = ToastConstants;

const ToastProvider = memo(props => {
  const { children } = props;

  const [topPosition, setTopPosition] = useState(DEFAULT_TOP_POSITION);
  const [icon, setIcon] = useState(undefined);
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef([]);
  const nextToastIdRef = useRef(0);

  // Read from a ref at creation time: the delete buttons set the callback and open a toast in the same commit.
  const currentOnCloseToastRef = useRef(undefined);
  // A toast runs only its own callback, so they are kept per toast id.
  const onCloseCallbacksRef = useRef(new Map());

  const updateToasts = useCallback(updater => {
    toastsRef.current = updater(toastsRef.current);
    setToasts(toastsRef.current);
  }, []);

  const runOnCloseCallback = useCallback(id => {
    const callbacks = onCloseCallbacksRef.current;
    const callback = callbacks.get(id);
    callbacks.delete(id);
    callback?.();
  }, []);

  const setOnCloseToast = useCallback(onCloseToast => {
    currentOnCloseToastRef.current = onCloseToast;

    // The page is unmounting: its pending callbacks must not run afterwards (e.g. navigating away).
    if (!onCloseToast) {
      onCloseCallbacksRef.current.clear();
    }
  }, []);

  const openToast = useCallback(
    (severity, message) => {
      nextToastIdRef.current += 1;
      const id = nextToastIdRef.current;
      if (currentOnCloseToastRef.current) {
        onCloseCallbacksRef.current.set(id, currentOnCloseToastRef.current);
      }

      const next = [...toastsRef.current, { id, severity, message, open: true }];
      const droppedToasts = next.slice(0, Math.max(0, next.length - MAX_TOASTS));
      updateToasts(() => next.slice(droppedToasts.length));
      droppedToasts.forEach(toast => runOnCloseCallback(toast.id));
    },
    [runOnCloseCallback, updateToasts],
  );

  // Starts the fade-out of one toast. clearToast removes it once the fade-out has ended.
  const closeToast = useCallback(
    id => updateToasts(prev => prev.map(toast => (toast.id === id ? { ...toast, open: false } : toast))),
    [updateToasts],
  );

  // Removes one toast, or all toasts when no id is given, and runs their callbacks.
  const clearToast = useCallback(
    id => {
      const idsToRun = id === undefined ? [...onCloseCallbacksRef.current.keys()] : [id];

      updateToasts(prev => (id === undefined ? [] : prev.filter(toast => toast.id !== id)));
      idsToRun.forEach(runOnCloseCallback);
    },
    [runOnCloseCallback, updateToasts],
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
