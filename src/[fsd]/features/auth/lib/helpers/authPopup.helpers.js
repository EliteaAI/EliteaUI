import { AuthConstants } from '@/[fsd]/features/auth/lib/constants';
import { DEV, VITE_BASE_URI, VITE_DEV_SERVER } from '@/common/constants.js';
import RouteDefinitions from '@/routes';

// Authentication popup handling
let authPromise = null;
let authResolve = null;
let authReject = null;
let authState = null;
let broadcastChannel = null;
let popupCheckInterval = null;

// Popup size constraints
const AUTH_POPUP_MIN_WIDTH = 500;
const AUTH_POPUP_MIN_HEIGHT = 600;
const AUTH_POPUP_MAX_WIDTH = 800;
const AUTH_POPUP_MAX_HEIGHT = 900;
const AUTH_POPUP_WIDTH_RATIO = 0.4; // 40% of browser width
const AUTH_POPUP_HEIGHT_RATIO = 0.7; // 70% of browser height

/**
 * Open a popup window for re-authentication when session expires.
 * This preserves the main window state (unsaved changes).
 *
 * The popup navigates to our callback page through the backend.
 * This triggers forward-auth which redirects to login.
 * The login's target_to token encodes the callback URL.
 * After login, user is redirected back to the callback page.
 * The callback page communicates success and closes.
 */
export const openAuthPopup = () => {
  // If already authenticating, return existing promise
  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise((resolve, reject) => {
    authResolve = resolve;
    authReject = reject;

    // Generate unique state for security
    authState = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem(AuthConstants.AUTH_STATE_KEY, authState);

    // Set up BroadcastChannel listener for this specific auth flow
    try {
      broadcastChannel = new BroadcastChannel(`elitea-auth-${authState}`);
      broadcastChannel.onmessage = event => {
        handleAuthResult({ origin: window.location.origin, data: event.data });
      };
    } catch {
      // BroadcastChannel not supported
    }

    // Calculate popup size based on browser window size
    const popupWidth = Math.min(
      AUTH_POPUP_MAX_WIDTH,
      Math.max(AUTH_POPUP_MIN_WIDTH, Math.round(window.outerWidth * AUTH_POPUP_WIDTH_RATIO)),
    );
    const popupHeight = Math.min(
      AUTH_POPUP_MAX_HEIGHT,
      Math.max(AUTH_POPUP_MIN_HEIGHT, Math.round(window.outerHeight * AUTH_POPUP_HEIGHT_RATIO)),
    );

    // Calculate centered popup position
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    // Construct callback URL that goes through the backend
    // VITE_DEV_SERVER in dev mode points to backend (e.g., http://localhost)
    // VITE_BASE_URI is the app's base path (e.g., /elitea_ui)
    const baseOrigin = DEV && VITE_DEV_SERVER ? VITE_DEV_SERVER : window.location.origin;
    const basePath = VITE_BASE_URI || '';
    const callbackUrl = `${baseOrigin}${basePath}${RouteDefinitions.AuthCallbackPage}?${AuthConstants.AUTH_STATE_PARAM}=${authState}`;

    const popup = window.open(
      callbackUrl,
      'elitea-auth',
      `width=${popupWidth},height=${popupHeight},left=${Math.max(0, left)},top=${Math.max(0, top)},` +
        'menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes',
    );

    if (!popup) {
      // Popup was blocked - fall back to redirect
      // eslint-disable-next-line no-console
      console.warn('Popup blocked, falling back to page refresh');
      window.location.reload();
      reject(new Error('Popup blocked'));
      authPromise = null;
      return;
    }

    // Monitor popup close AND poll localStorage for auth result
    popupCheckInterval = setInterval(() => {
      // Check localStorage for auth result (most reliable fallback)
      try {
        const storedResult = localStorage.getItem(AuthConstants.AUTH_RESULT_KEY);
        if (storedResult) {
          const result = JSON.parse(storedResult);
          if (result.state === authState && result.type === AuthConstants.AUTH_MESSAGE_TYPE) {
            localStorage.removeItem(AuthConstants.AUTH_RESULT_KEY);
            handleAuthResult({ origin: window.location.origin, data: result });
            return;
          }
        }
      } catch {
        // Ignore parse errors
      }

      // Check if popup was closed without completing auth
      if (popup.closed) {
        clearInterval(popupCheckInterval);
        popupCheckInterval = null;
        // Only reject if not already resolved
        if (authPromise && authReject) {
          cleanupAuth();
          reject(new Error('Popup closed'));
        }
      }
    }, 300);
  });

  return authPromise;
};

/**
 * Clean up auth state
 */
const cleanupAuth = () => {
  sessionStorage.removeItem(AuthConstants.AUTH_STATE_KEY);
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval);
    popupCheckInterval = null;
  }
  authPromise = null;
  authState = null;
};

/**
 * Handle auth result from popup window
 */
export const handleAuthResult = event => {
  // Only process if we're actively waiting for auth
  if (!authPromise) {
    return;
  }

  // Allow same origin or check if it's from our expected flow
  if (event.origin !== window.location.origin) {
    return;
  }

  const { type, success, state } = event.data || {};

  // Only process our auth messages
  if (type !== AuthConstants.AUTH_MESSAGE_TYPE) {
    return;
  }

  // Verify state - check both sessionStorage and module variable
  const expectedState = authState || sessionStorage.getItem(AuthConstants.AUTH_STATE_KEY);
  if (state !== expectedState) {
    return;
  }

  // Store resolve/reject before cleanup
  const resolve = authResolve;
  const reject = authReject;

  // Clean up first
  cleanupAuth();
  authResolve = null;
  authReject = null;

  // Then resolve/reject
  if (success) {
    resolve?.();
  } else {
    reject?.(new Error('Re-authentication failed'));
  }
};

/**
 * Initialize auth popup listeners.
 * Call this once at app startup.
 */
export const initAuthPopupListeners = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('message', handleAuthResult);

  // Also listen for localStorage changes (fallback)
  window.addEventListener('storage', event => {
    if (event.key === AuthConstants.AUTH_RESULT_KEY && event.newValue) {
      try {
        const result = JSON.parse(event.newValue);
        handleAuthResult({ origin: window.location.origin, data: result });
        localStorage.removeItem(AuthConstants.AUTH_RESULT_KEY);
      } catch {
        // Ignore
      }
    }
  });
};

// Auto-initialize listeners
initAuthPopupListeners();
