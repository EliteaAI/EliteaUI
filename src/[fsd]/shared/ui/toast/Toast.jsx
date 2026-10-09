import { memo, useCallback, useEffect, useState } from 'react';

import { Alert, Box, Snackbar } from '@mui/material';

import { ToastConstants } from '@/[fsd]/shared/lib/constants';

const { DEFAULT_TOP_POSITION, TOAST_DURATION_DEFAULTS } = ToastConstants;

const ANCHOR_ORIGIN = { vertical: 'top', horizontal: 'center' };

const Toast = memo(props => {
  const {
    open,
    severity,
    message,
    autoHideDuration = TOAST_DURATION_DEFAULTS.info,
    onClose,
    topPosition = DEFAULT_TOP_POSITION,
    icon,
  } = props;

  const [showToast, setShowToast] = useState(open);

  const handleClose = useCallback(
    (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }

      onClose?.();
      setShowToast(false);
    },
    [onClose],
  );

  useEffect(() => {
    setShowToast(open);
  }, [open]);

  const styles = toastStyles(topPosition);

  return (
    <Snackbar
      sx={styles.root}
      anchorOrigin={ANCHOR_ORIGIN}
      open={showToast}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
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
const toastStyles = topPosition => ({
  root: {
    top: `${topPosition} !important`,
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
