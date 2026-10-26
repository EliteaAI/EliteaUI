import { eliteaApi } from '@/api';

const TAG_TYPE_OAUTH_APPS = 'OAUTH_APPS';

const oauthAppsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_OAUTH_APPS],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Admin-managed OAuth apps a credential of this type may use (no secrets)
      oauthAppList: build.query({
        query: ({ projectId, type }) => ({
          url: `/configurations/oauth_apps/${projectId}`,
          params: type ? { type } : undefined,
        }),
        transformResponse: response => ({ apps: response?.rows || [], mode: response?.mode || 'custom' }),
        providesTags: [TAG_TYPE_OAUTH_APPS],
      }),
    }),
  });

export const { useOAuthAppListQuery } = oauthAppsApi;
