import { eliteaApi } from '@/api';

const generateSkillDraftApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    generateSkillDraft: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/generate_skill_draft/prompt_lib/${projectId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useGenerateSkillDraftMutation } = generateSkillDraftApi;
