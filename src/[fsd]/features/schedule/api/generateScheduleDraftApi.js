import { eliteaApi } from '@/api';

export const generateScheduleDraftApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generateScheduleDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/generate_schedule_draft/prompt_lib/${projectId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateScheduleDraftMutation } = generateScheduleDraftApi;
