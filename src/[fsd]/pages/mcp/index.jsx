import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

const isDev = import.meta.env.DEV;

/**
 * Send auth result to parent/opener window.
 * Uses multiple methods to ensure delivery even if window.opener is lost:
 * 1. window.opener.postMessage - direct communication if opener exists
 * 2. BroadcastChannel - works across all tabs/windows of same origin
 * 3. localStorage event - fallback for browsers without BroadcastChannel
 */
const sendAuthResult = message => {
  // Method 1: Direct postMessage to opener (if available)
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(message, window.location.origin);
    } catch {
      // Opener may be blocked or cross-origin
    }
  }

  // Method 2: BroadcastChannel (works across all tabs of same origin)
  // Use state-specific channel name for security
  if (message.state) {
    try {
      const channel = new BroadcastChannel(`mcp-auth-${message.state}`);
      channel.postMessage(message);
      channel.close();
    } catch {
      // BroadcastChannel not supported
    }
  }

  // Method 3: localStorage event (fallback - triggers 'storage' event in other tabs)
  try {
    const key = `mcp-auth-result-${message.state}`;
    localStorage.setItem(key, JSON.stringify(message));
    // Clean up after a short delay
    setTimeout(() => localStorage.removeItem(key), 5000);
  } catch {
    // localStorage may be disabled
  }
};

/**
 * MCP OAuth Callback Page
 *
 * This page receives the OAuth authorization code from the MCP server's redirect.
 * It simply passes the code back to the parent window (main app) via postMessage.
 * The parent window will then perform the token exchange using the authenticated API.
 *
 * This approach ensures:
 * 1. Token exchange uses the app's access_token (user is already logged in)
 * 2. No need to handle authentication in the popup
 * 3. Proper CORS handling via the authenticated API proxy
 */
const McpAuthPage = memo(() => {
  const styles = mcpAuthPageStyles();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  // Use ref to prevent double-processing in React Strict Mode
  const processedRef = useRef(false);

  // Parse URL params (this is cheap and safe to do on every render)
  const authParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
      error_description: params.get('error_description'),
    };
  }, []);

  useEffect(() => {
    // Prevent double-processing in React Strict Mode
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const handleAuth = async () => {
      // If there's an OAuth error, send it back immediately
      if (authParams.error) {
        sendAuthResult({
          type: 'mcp-auth-result',
          state: authParams.state,
          error: authParams.error,
          error_description: authParams.error_description,
        });
        setStatus('error');
        setErrorMessage(authParams.error_description || authParams.error);
        // Only auto-close in production
        if (!isDev) {
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      // If we have an authorization code, send it back to parent for token exchange
      if (authParams.code) {
        // Send authorization code back to parent window
        // Parent will perform token exchange with authenticated API
        sendAuthResult({
          type: 'mcp-auth-result',
          state: authParams.state,
          success: true,
          code: authParams.code,
        });

        setStatus('success');
        // Always close on success
        setTimeout(() => window.close(), 1000);
      } else {
        // No code, send error back
        sendAuthResult({
          type: 'mcp-auth-result',
          state: authParams.state,
          error: 'invalid_request',
          error_description: 'Missing authorization code',
        });
        setStatus('error');
        setErrorMessage('Invalid authorization response');
        // Only auto-close in production
        if (!isDev) {
          // setTimeout(() => window.close(), 2000);
        }
      }
    };

    handleAuth();
  }, [authParams]);

  return (
    <Box sx={styles.container}>
      {status === 'processing' && (
        <>
          <CircularProgress size={24} />
          <Typography
            variant="bodyMedium"
            sx={styles.message}
          >
            Processing authorization...
          </Typography>
        </>
      )}
      {status === 'exchanging' && (
        <>
          <CircularProgress size={24} />
          <Typography
            variant="bodyMedium"
            sx={styles.message}
          >
            Exchanging authorization code for access token...
          </Typography>
        </>
      )}
      {status === 'success' && (
        <Typography
          variant="bodyMedium"
          sx={styles.successMessage}
        >
          ✓ Authorization successful! Closing window...
        </Typography>
      )}
      {status === 'error' && (
        <>
          <Typography
            variant="bodyMedium"
            sx={styles.errorMessage}
          >
            ✗ Authorization failed
          </Typography>
          {errorMessage && (
            <Typography
              variant="bodySmall"
              sx={styles.errorDetail}
            >
              {errorMessage}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
});

McpAuthPage.displayName = 'McpAuthPage';

/** @type {MuiSx} */
const mcpAuthPageStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '100vh',
    gap: '1rem',
  },
  message: {
    textAlign: 'center',
  },
  successMessage: ({ palette }) => ({
    color: palette.status.published,
    textAlign: 'center',
  }),
  errorMessage: ({ palette }) => ({
    color: palette.status.rejected,
    textAlign: 'center',
  }),
  errorDetail: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
    marginTop: '0.5rem',
  }),
});

export default McpAuthPage;
