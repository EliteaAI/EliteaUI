import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/elitea_core';

export const mcpOAuthApi = eliteaApi.injectEndpoints({
  endpoints: build => ({
    exchangeMcpOAuthToken: build.mutation({
      query: ({ projectId, ...body }) => {
        // Filter out null/undefined values to avoid sending them to the server
        const filteredBody = Object.fromEntries(Object.entries(body).filter(([, v]) => v != null));
        return {
          url: `${apiSlicePath}/mcp_oauth_proxy/${projectId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: filteredBody,
        };
      },
    }),
    refreshMcpOAuthToken: build.mutation({
      query: ({ projectId, ...body }) => {
        // Filter out null/undefined values to avoid sending them to the server
        const filteredBody = Object.fromEntries(Object.entries(body).filter(([, v]) => v != null));
        return {
          url: `${apiSlicePath}/mcp_oauth_proxy/${projectId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            ...filteredBody,
            grant_type: 'refresh_token',
          },
        };
      },
    }),
    registerMcpDynamicClient: build.mutation({
      query: ({ projectId, ...body }) => {
        // Filter out null/undefined values to avoid sending them to the server
        const filteredBody = Object.fromEntries(Object.entries(body).filter(([, v]) => v != null));
        return {
          url: `${apiSlicePath}/mcp_dcr_proxy/${projectId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: filteredBody,
        };
      },
    }),
  }),
});

export const {
  useExchangeMcpOAuthTokenMutation,
  useRefreshMcpOAuthTokenMutation,
  useRegisterMcpDynamicClientMutation,
} = mcpOAuthApi;
