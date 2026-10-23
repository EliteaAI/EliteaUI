import { eliteaApi } from '@/api';

export const generateScheduleDraftApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generateScheduleDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/schedules/prompt_lib/${projectId}/draft`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateScheduleDraftMutation } = generateScheduleDraftApi;
