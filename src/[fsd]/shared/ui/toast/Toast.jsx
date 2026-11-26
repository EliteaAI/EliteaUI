import { memo, useCallback, useEffect, useState } from 'react';

import { Alert, Box, Snackbar } from '@mui/material';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';

const { TOAST_DURATION_DEFAULTS } = ToastConstants;

const ANCHOR_ORIGIN = { vertical: 'top', horizontal: 'center' };

const Toast = memo(props => {
  const { open, severity, message, autoHideDuration = TOAST_DURATION_DEFAULTS.info, onClose, icon } = props;

  const [showToast, setShowToast] = useState(open);

  const handleClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setShowToast(false);
  }, []);

  // Report the close once the exit transition has finished, so the toast fades out before it is removed.
  const handleExited = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    setShowToast(open);
  }, [open]);

  const styles = toastStyles();

  return (
    <Snackbar
      sx={styles.root}
      anchorOrigin={ANCHOR_ORIGIN}
      open={showToast}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      slotProps={{ transition: { onExited: handleExited } }}
    >
      <Alert
        data-testid="toast-alert"
        data-severity={severity}
        elevation={6}
        variant="filled"
        onClose={handleClose}
        severity={severity}
        sx={styles.alert}
        icon={icon}
        // Testid goes onto MuiAlert's OWN close button via its `closeButton`
        // slot. Do NOT reach for the `action` prop instead: Alert.js renders
        // its built-in close button only when `action == null && onClose`, so
        // passing `action` REPLACES that button — which silently changes the
        // icon, its size and its color on every toast in the product.
        slotProps={{ closeButton: { 'data-testid': 'toast-dismiss-button' } }}
      >
        <Box
          data-testid="toast-message"
          sx={styles.message}
        >
          {message}
        </Box>
      </Alert>
    </Snackbar>
  );
});

Toast.displayName = 'Toast';

/** @type {MuiSx} */
const toastStyles = () => ({
  // The toasts are stacked by the container in ToastComponent, so each one flows in place instead of being fixed.
  root: {
    position: 'static !important',
    top: 'auto !important',
    left: 'auto !important',
    right: 'auto !important',
    transform: 'none !important',
  },
  alert: {
    width: '100%',
  },
  message: {
    maxWidth: '50vw',
    whiteSpace: 'pre-line',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    '&:hover': {
      WebkitLineClamp: 'unset',
      overflow: 'visible',
      maxHeight: '80vh',
    },
  },
});

export default Toast;
