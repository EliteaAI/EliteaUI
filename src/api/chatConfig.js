import { alitaApi } from './alitaApi.js';

const apiSlicePath = '/elitea_core/chat_config';

export const TAG_CHAT_CONFIG = 'TAG_CHAT_CONFIG';

export const chatConfigApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_CHAT_CONFIG],
  })
  .injectEndpoints({
    endpoints: build => ({
      getChatConfig: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}`,
        }),
        providesTags: [TAG_CHAT_CONFIG],
      }),
    }),
  });

export const { useGetChatConfigQuery, useLazyGetChatConfigQuery } = chatConfigApi;
