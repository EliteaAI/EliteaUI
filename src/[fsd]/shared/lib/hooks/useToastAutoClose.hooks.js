import { useEffect, useRef } from 'react';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';

const { TOAST_STAGGER_GAP, TOAST_TICK_INTERVAL } = ToastConstants;

// Closes due toasts one at a time (oldest first, TOAST_STAGGER_GAP apart). No time passes while `isPaused()` is true;
// it is polled every tick because a removed hovered or focused toast sends no mouse leave or blur event.
export const useToastAutoClose = props => {
  const { toasts, durations, isPaused, onAutoClose } = props;

  const toastsRef = useRef(toasts);
  const durationsRef = useRef(durations);
  const isPausedRef = useRef(isPaused);
  const onAutoCloseRef = useRef(onAutoClose);
  const remainingRef = useRef(new Map());
  const lastAutoCloseAtRef = useRef(0);

  useEffect(() => {
    toastsRef.current = toasts;
    durationsRef.current = durations;
    isPausedRef.current = isPaused;
    onAutoCloseRef.current = onAutoClose;
  }, [toasts, durations, isPaused, onAutoClose]);

  const hasToasts = toasts.length > 0;

  useEffect(() => {
    const remaining = remainingRef.current;

    if (!hasToasts) {
      remaining.clear();
      return undefined;
    }

    let lastTickAt = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickAt;
      lastTickAt = now;

      if (isPausedRef.current?.()) {
        return;
      }

      const currentToasts = toastsRef.current;
      const currentIds = new Set(currentToasts.map(toast => toast.id));
      remaining.forEach((_, id) => {
        if (!currentIds.has(id)) {
          remaining.delete(id);
        }
      });

      let dueToast;
      currentToasts.forEach(toast => {
        if (!toast.open) {
          return;
        }
        const duration = durationsRef.current[toast.severity] ?? durationsRef.current.info;
        const timeLeft = (remaining.get(toast.id) ?? duration) - elapsed;
        remaining.set(toast.id, timeLeft);
        if (timeLeft <= 0 && !dueToast) {
          dueToast = toast;
        }
      });

      if (dueToast && now - lastAutoCloseAtRef.current >= TOAST_STAGGER_GAP) {
        lastAutoCloseAtRef.current = now;
        // Never report the same toast twice while it is still listed as open.
        remaining.set(dueToast.id, Number.POSITIVE_INFINITY);
        onAutoCloseRef.current(dueToast.id);
      }
    }, TOAST_TICK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [hasToasts]);
};
