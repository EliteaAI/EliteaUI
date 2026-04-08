import { AuthConstants } from '@/[fsd]/features/auth/lib/constants';

/**
 * Send auth result to parent/opener window.
 * Uses multiple methods to ensure delivery even if window.opener is lost:
 * 1. window.opener.postMessage - direct communication if opener exists
 * 2. BroadcastChannel - works across all tabs/windows of same origin
 * 3. localStorage event - fallback for browsers without BroadcastChannel
 */
export const sendAuthResult = message => {
  // Method 1: Direct postMessage to opener (if available)
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.postMessage(message, window.location.origin);
    } catch {
      // Opener may be blocked or cross-origin
    }
  }

  // Method 2: BroadcastChannel (works across all tabs of same origin)
  if (message.state) {
    try {
      const channel = new BroadcastChannel(`elitea-auth-${message.state}`);
      channel.postMessage(message);
      // Delay closing to ensure message is sent
      setTimeout(() => channel.close(), 100);
    } catch {
      // BroadcastChannel not supported
    }
  }

  // Method 3: localStorage event (fallback - triggers 'storage' event in other tabs)
  try {
    localStorage.setItem(AuthConstants.AUTH_RESULT_KEY, JSON.stringify(message));
    // Clean up after a short delay
    setTimeout(() => localStorage.removeItem(AuthConstants.AUTH_RESULT_KEY), 5000);
  } catch {
    // localStorage access failed
  }
};
