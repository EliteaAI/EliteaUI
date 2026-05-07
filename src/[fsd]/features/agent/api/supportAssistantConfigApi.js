import { eliteaApi } from '@/api/eliteaApi.js';

const TAG_SUPPORT_ASSISTANT_CONFIG = 'TAG_SUPPORT_ASSISTANT_CONFIG';

const supportAssistantConfigApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_SUPPORT_ASSISTANT_CONFIG],
  })
  .injectEndpoints({
    endpoints: build => ({
      getSupportAssistantConfig: build.query({
        query: () => ({
          url: '/admin/plugin_config_values/administration/support_assistant',
        }),
        providesTags: [TAG_SUPPORT_ASSISTANT_CONFIG],
      }),
    }),
  });

export const { useGetSupportAssistantConfigQuery } = supportAssistantConfigApi;
