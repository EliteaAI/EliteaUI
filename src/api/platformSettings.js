import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/elitea_core/platform_settings';

export const TAG_PLATFORM_SETTINGS = 'TAG_PLATFORM_SETTINGS';

export const platformSettingsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_PLATFORM_SETTINGS],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Get platform-level feature settings
      getPlatformSettings: build.query({
        // projectId resolves per-project availability (e.g. tool_spend.web_search)
        query: ({ projectId } = {}) => ({
          url: `${apiSlicePath}/prompt_lib`,
          params: projectId ? { project_id: projectId } : undefined,
        }),
        providesTags: [TAG_PLATFORM_SETTINGS],
      }),
    }),
  });

export const { useGetPlatformSettingsQuery, useLazyGetPlatformSettingsQuery } = platformSettingsApi;
