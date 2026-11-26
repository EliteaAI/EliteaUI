import { memo, useCallback } from 'react';

import Toast from './Toast';

const ToastItem = memo(props => {
  const { id, open, severity, message, icon, onClose } = props;

  const handleClose = useCallback(() => onClose(id), [id, onClose]);

  return (
    <Toast
      open={open}
      severity={severity}
      message={typeof message === 'string' ? message : message?.toString() || 'Unknown error'}
      onClose={handleClose}
      // The toasts are closed by useToastAutoClose, so the Snackbar's own timer is turned off.
      autoHideDuration={null}
      icon={icon}
    />
  );
});

ToastItem.displayName = 'ToastItem';

export default ToastItem;
