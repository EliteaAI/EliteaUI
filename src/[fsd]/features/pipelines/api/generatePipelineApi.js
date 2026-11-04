import { eliteaApi } from '@/api';

const generatePipelineApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generatePipelineDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/generate_pipeline_draft/prompt_lib/${projectId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGeneratePipelineDraftMutation } = generatePipelineApi;
