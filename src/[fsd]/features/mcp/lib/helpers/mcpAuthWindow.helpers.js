import { McpAuthFlowConstants } from '@/[fsd]/features/mcp/lib/constants';

export const openAuthPopup = () => {
  const { width, height } = McpAuthFlowConstants.MCP_SESSION_CONFIG.POPUP_SIZE;
  const popup = window.open('about:blank', '_blank', `width=${width},height=${height}`);
  if (popup) {
    const doc = popup.document;
    doc.body.style.cssText = 'font-family: sans-serif; padding: 20px; text-align: center;';
    const h2 = doc.createElement('h2');
    h2.textContent = 'Preparing authorization...';
    const p = doc.createElement('p');
    p.textContent = 'Please wait while we set up the authentication.';
    doc.body.appendChild(h2);
    doc.body.appendChild(p);
  }
  return popup;
};

const isValidAuthMessage = (data, state) =>
  (data.type === 'mcp-auth-code' || data.type === 'mcp-auth-result') && data.state === state;

export const createAuthorizationMonitor = (authWindow, state, onSuccess, onError) => {
  let isCleanedUp = false;
  let broadcastChannel = null;

  // Timeout for the entire authorization flow (5 minutes)
  const timeoutId = setTimeout(
    () => {
      if (!isCleanedUp) {
        cleanup();
        onError(new Error('Authorization timed out. Please try again.'));
      }
    },
    5 * 60 * 1000,
  );

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    window.removeEventListener('message', postMessageHandler);
    window.removeEventListener('storage', storageHandler);
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    clearTimeout(timeoutId);
    // Clean up localStorage key if it exists
    try {
      localStorage.removeItem(`mcp-auth-result-${state}`);
    } catch {
      // Ignore
    }
  };

  const handleAuthResult = data => {
    if (!isValidAuthMessage(data, state)) return false;

    cleanup();

    if (data.error) {
      onError(new Error(data.error_description || data.error));
    } else if (data.type === 'mcp-auth-result' && data.success && data.tokenData) {
      onSuccess(data);
    } else if (data.code) {
      onSuccess({ code: data.code });
    } else {
      onError(new Error('No authorization result received'));
    }
    return true;
  };

  // Method 1: Listen for postMessage (direct from popup if opener exists)
  const postMessageHandler = event => {
    if (event.origin !== window.location.origin) return;
    const data = event.data || {};
    handleAuthResult(data);
  };
  window.addEventListener('message', postMessageHandler);

  // Method 2: Listen on BroadcastChannel (works across all tabs)
  // Use state-specific channel name for security
  try {
    broadcastChannel = new BroadcastChannel(`mcp-auth-${state}`);
    broadcastChannel.onmessage = event => {
      handleAuthResult(event.data);
    };
  } catch {
    // BroadcastChannel not supported, fall back to localStorage only
  }

  // Method 3: Listen for localStorage changes (fallback)
  const storageHandler = event => {
    if (event.key === `mcp-auth-result-${state}` && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        handleAuthResult(data);
      } catch {
        // Ignore parse errors
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  // Also check if localStorage already has the result (in case callback fired before listener was set up)
  try {
    const existingResult = localStorage.getItem(`mcp-auth-result-${state}`);
    if (existingResult) {
      const data = JSON.parse(existingResult);
      // Use setTimeout to not block current execution
      setTimeout(() => handleAuthResult(data), 0);
    }
  } catch {
    // Ignore
  }

  // Return cleanup function - caller can use this to cancel
  return cleanup;
};

export const navigateAuthPopup = (authWindow, authUrl) => {
  if (authWindow.closed) {
    throw new Error('Authorization window was closed');
  }
  authWindow.location.href = authUrl;
};
