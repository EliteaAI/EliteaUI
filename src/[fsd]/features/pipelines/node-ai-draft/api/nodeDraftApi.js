import { eliteaApi } from '@/api';

const nodeDraftApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generatePipelineNodeDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/generate_pipeline_node_draft/prompt_lib/${projectId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGeneratePipelineNodeDraftMutation } = nodeDraftApi;
