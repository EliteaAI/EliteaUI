import { alitaApi } from './alitaApi.js';

const apiSlicePath = '/elitea_core/platform_settings';

export const TAG_PLATFORM_SETTINGS = 'TAG_PLATFORM_SETTINGS';

export const platformSettingsApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_PLATFORM_SETTINGS],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Get platform-level feature settings
      getPlatformSettings: build.query({
        query: () => ({
          url: `${apiSlicePath}/prompt_lib`,
        }),
        providesTags: [TAG_PLATFORM_SETTINGS],
      }),
    }),
  });

export const { useGetPlatformSettingsQuery, useLazyGetPlatformSettingsQuery } = platformSettingsApi;
