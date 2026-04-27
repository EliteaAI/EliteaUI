import { AuthPopupHelpers } from '@/[fsd]/features/auth/lib/helpers';
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants.js';
import { generateTraceparent } from '@/services/tracing';
import { getEnvVar } from '@/utils/env';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Check if tracing is enabled
const TRACING_ENABLED = getEnvVar('VITE_TRACING_ENABLED') === 'true';

// https://redux-toolkit.js.org/rtk-query/api/createApi
export const alitaApi = createApi({
  reducerPath: 'alitaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: VITE_SERVER_URL,
    // mode: "cors",
    fetchFn: async (input, init) => {
      // Clone request BEFORE first fetch for potential retry (body can only be read once)
      const retryRequest = input instanceof Request ? input.clone() : null;

      const response = await fetch(input, init);
      if (response.redirected) {
        const redirectUrl = new URL(response.url);
        redirectUrl.searchParams.delete('target_to');
        const loginUrl = redirectUrl.toString();

        // Check if this is a session expiry redirect (forward-auth login page)
        // Backend redirects to: /forward-auth/auth_form/login or /forward-auth/auth_oidc/login
        const isSessionAuthRedirect = loginUrl.includes('/forward-auth/') && loginUrl.includes('/login');

        if (isSessionAuthRedirect) {
          // Open popup for re-authentication instead of redirecting main window
          try {
            await AuthPopupHelpers.openAuthPopup();
            // Re-authentication successful - retry the original request
            const retryResponse = await fetch(retryRequest || input, init);
            return retryResponse;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Re-authentication failed:', error);
            // If popup fails (blocked or user closed), fall back to redirect
            window.location.href = loginUrl;
            return { loginUrl };
          }
        } else {
          // Non-auth redirect - follow it
          window.location.href = loginUrl;
          return { loginUrl };
        }
      }
      return response;
    },
    prepareHeaders: headers => {
      // Add W3C traceparent header for distributed tracing
      // Format: {version}-{trace-id}-{span-id}-{trace-flags}
      // Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
      if (TRACING_ENABLED) {
        headers.set('traceparent', generateTraceparent());
      }

      if (DEV) {
        VITE_DEV_TOKEN && headers.set('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
        headers.set('Cache-Control', 'no-cache');
      }
      return headers;
    },
  }),
  tagTypes: [], // Here we specify tags for caching and invalidation
  endpoints: () => ({}),
});

export const { middleware, reducer, reducerPath } = alitaApi;
