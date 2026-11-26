import { memo, useCallback, useContext, useRef } from 'react';

import { Box } from '@mui/material';

import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import { useAllToastDurations } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { useToastAutoClose } from '@/[fsd]/shared/lib/hooks/useToastAutoClose.hooks';

import ToastItem from './ToastItem';

const ToastComponent = memo(() => {
  const { clearToast, closeToast, toasts, topPosition, icon } = useContext(ToastContext);
  const toastDurations = useAllToastDurations();
  const containerRef = useRef(null);

  // Checked on every tick instead of tracking mouse and focus events: when the hovered or focused toast is
  // removed, the browser sends no mouse leave or blur event, which would leave the timers paused forever.
  const isPaused = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return false;
    }
    return container.matches(':hover') || container.contains(document.activeElement);
  }, []);

  useToastAutoClose({
    toasts,
    durations: toastDurations,
    isPaused,
    onAutoClose: closeToast,
  });

  const hasToasts = toasts.length > 0;

  if (!hasToasts) {
    return null;
  }

  const styles = toastComponentStyles(topPosition);

  return (
    <Box
      data-testid="toast-stack"
      ref={containerRef}
      sx={styles.container}
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          open={toast.open}
          severity={toast.severity}
          message={toast.message}
          icon={icon}
          onClose={clearToast}
        />
      ))}
    </Box>
  );
});

ToastComponent.displayName = 'ToastComponent';

/** @type {MuiSx} */
const toastComponentStyles = topPosition => ({
  container: theme => ({
    position: 'fixed',
    top: topPosition,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.snackbar,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    // Let clicks pass through the empty space around the toasts.
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'auto',
    },
  }),
});

export default ToastComponent;
