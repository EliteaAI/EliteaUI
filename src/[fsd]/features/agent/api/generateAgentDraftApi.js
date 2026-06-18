import { eliteaApi } from '@/api';

const generateAgentDraftApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generateAgentDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/generate_application_draft/prompt_lib/${projectId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateAgentDraftMutation } = generateAgentDraftApi;
