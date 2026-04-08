import { memo, useEffect, useRef, useState } from 'react';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, CircularProgress, Typography } from '@mui/material';

import { AuthConstants } from '@/[fsd]/features/auth/lib/constants';
import { AuthHelpers } from '@/[fsd]/features/auth/lib/helpers';

/**
 * Authentication Callback Page
 *
 * This page is loaded after the user successfully logs in via the popup.
 * It communicates the success back to the main window and closes itself.
 *
 * The page detects successful authentication by checking if the user is now logged in
 * (the auth cookie/session should be set by this point).
 */
const AuthCallbackPage = memo(() => {
  const [status, setStatus] = useState('processing');
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double-processing in React Strict Mode
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const handleCallback = () => {
      // Get the auth state from URL parameter only
      // Note: sessionStorage is NOT shared between windows, so we can only use URL param
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get(AuthConstants.AUTH_STATE_PARAM);

      if (!state) {
        // No state found - this might not be an auth callback
        setStatus('error');
        return;
      }

      // Send success message to parent window
      AuthHelpers.sendAuthResult({
        type: AuthConstants.AUTH_MESSAGE_TYPE,
        state,
        success: true,
      });

      setStatus('success');

      // Close popup after a short delay to show success message
      setTimeout(() => {
        window.close();
      }, 300);
    };

    handleCallback();
  }, []);

  return (
    <Box sx={styles.container}>
      {status === 'processing' && (
        <>
          <CircularProgress size={48} />
          <Typography
            variant="headingSmall"
            sx={styles.statusText}
          >
            Completing login...
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircleOutlineIcon sx={styles.successIcon} />
          <Typography
            variant="headingSmall"
            sx={styles.statusText}
          >
            Login Successful!
          </Typography>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.descriptionText}
          >
            This window will close automatically...
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <ErrorOutlineIcon sx={styles.errorIcon} />
          <Typography
            variant="headingSmall"
            sx={styles.statusText}
          >
            Something went wrong
          </Typography>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.descriptionText}
          >
            Please close this window and try again.
          </Typography>
        </>
      )}
    </Box>
  );
});

AuthCallbackPage.displayName = 'AuthCallbackPage';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '1.5rem',
    textAlign: 'center',
    bgcolor: 'background.default',
  },
  statusText: {
    marginTop: '1rem',
  },
  descriptionText: {
    marginTop: '0.5rem',
  },
  successIcon: {
    fontSize: '3rem',
    color: 'success.main',
  },
  errorIcon: {
    fontSize: '3rem',
    color: 'error.main',
  },
};

export default AuthCallbackPage;
