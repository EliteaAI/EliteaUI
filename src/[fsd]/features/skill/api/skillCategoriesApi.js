import { eliteaApi } from '@/api/eliteaApi.js';

const apiSlicePath = '/elitea_core/skill_categories';

const TAG_SKILL_CATEGORIES = 'TAG_SKILL_CATEGORIES';

const skillCategoriesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_SKILL_CATEGORIES],
  })
  .injectEndpoints({
    endpoints: build => ({
      getSkillCategories: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}`,
        }),
        providesTags: [TAG_SKILL_CATEGORIES],
      }),
    }),
  });

export const { useGetSkillCategoriesQuery, useLazyGetSkillCategoriesQuery } = skillCategoriesApi;
