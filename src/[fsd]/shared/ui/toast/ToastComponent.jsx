import { memo, useContext } from 'react';

import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import { useAllToastDurations } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';

import Toast from './Toast';

const ToastComponent = memo(() => {
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
});

ToastComponent.displayName = 'ToastComponent';

export default ToastComponent;
