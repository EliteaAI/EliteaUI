import { useEffect, useRef } from 'react';

import { TOAST_STAGGER_GAP, TOAST_TICK_INTERVAL } from '@/[fsd]/shared/lib/constants/toast.constants';

// Closes toasts automatically after their duration, with two rules that keep a stack of toasts readable:
// - while `isPaused()` returns true, no time passes for any toast (hover or focus on the stack). It is a function
//   that is checked on every tick, so the pause ends by itself when its cause is gone, even if no event is sent.
// - toasts that are due are closed one at a time, at least TOAST_STAGGER_GAP apart, oldest first.
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

      // Time that passes while paused is not counted.
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
        // Never report the same toast twice, even if it is still listed as open on the next tick.
        remaining.set(dueToast.id, Number.POSITIVE_INFINITY);
        onAutoCloseRef.current(dueToast.id);
      }
    }, TOAST_TICK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [hasToasts]);
};
