import { eliteaApi } from './eliteaApi.js';

const TAG_RESOURCES = 'TAG_RESOURCES';

export const resourcesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_RESOURCES],
  })
  .injectEndpoints({
    endpoints: build => ({
      getSystemInfo: build.query({
        query: () => ({
          url: '/admin/system_info/prompt_lib',
        }),
        providesTags: [TAG_RESOURCES],
      }),
      getResourcesConfig: build.query({
        query: () => ({
          url: '/admin/plugin_config_values/prompt_lib/resources',
        }),
        providesTags: [TAG_RESOURCES],
      }),
    }),
  });

export const { useGetSystemInfoQuery, useGetResourcesConfigQuery } = resourcesApi;
