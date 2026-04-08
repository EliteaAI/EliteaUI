import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';

import { Box } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { TOAST_DURATION } from '@/common/constants';

const Alert = forwardRef((props, ref) => {
  return (
    <MuiAlert
      elevation={6}
      ref={ref}
      variant="filled"
      {...props}
    />
  );
});

const anchorOrigin = { vertical: 'top', horizontal: 'center' };

const Toast = ({
  open,
  severity,
  message,
  autoHideDuration = TOAST_DURATION,
  onClose,
  topPosition = '90px',
  icon,
}) => {
  const [showToast, setShowToast] = useState(open);
  const sx = useMemo(() => ({ top: `${topPosition} !important` }), [topPosition]);
  const onCloseHandler = useCallback(
    (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }

      if (onClose) {
        onClose();
      }
      setShowToast(false);
    },
    [onClose],
  );

  useEffect(() => {
    setShowToast(open);
  }, [open]);

  return (
    <Snackbar
      sx={sx}
      anchorOrigin={anchorOrigin}
      open={showToast}
      autoHideDuration={autoHideDuration}
      onClose={onCloseHandler}
    >
      <Alert
        onClose={onCloseHandler}
        severity={severity}
        sx={{ width: '100%' }}
        icon={icon}
      >
        <Box
          sx={{
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
          }}
        >
          {message}
        </Box>
      </Alert>
    </Snackbar>
  );
};

Alert.displayName = 'Alert';

export default Toast;
