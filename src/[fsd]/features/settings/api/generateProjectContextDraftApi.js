import { eliteaApi } from '@/api';

const generateProjectContextDraftApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generateProjectContextDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/generate_project_context_draft/prompt_lib/${projectId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateProjectContextDraftMutation } = generateProjectContextDraftApi;
