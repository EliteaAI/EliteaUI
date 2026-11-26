import { memo, useCallback } from 'react';

import Toast from './Toast';

const ToastItem = memo(props => {
  const { id, open, severity, message, icon, onClose, onExited } = props;

  const handleClose = useCallback(() => onClose(id), [id, onClose]);
  const handleExited = useCallback(() => onExited(id), [id, onExited]);

  return (
    <Toast
      open={open}
      severity={severity}
      message={typeof message === 'string' ? message : message?.toString() || 'Unknown error'}
      onClose={handleClose}
      onExited={handleExited}
      // useToastAutoClose closes the toasts, so the Snackbar's own timer is off.
      autoHideDuration={null}
      icon={icon}
    />
  );
});

ToastItem.displayName = 'ToastItem';

export default ToastItem;
