import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core/project_skills_settings';

const TAG_TYPE_PROJECT_SKILLS_PLATFORM_SETTINGS = 'PROJECT_SKILLS_PLATFORM_SETTINGS';

const projectSkillsSettingsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_PROJECT_SKILLS_PLATFORM_SETTINGS],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectSkillsPlatformSettings: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}`,
        }),
        providesTags: [TAG_TYPE_PROJECT_SKILLS_PLATFORM_SETTINGS],
      }),
    }),
  });

export const { useProjectSkillsPlatformSettingsQuery } = projectSkillsSettingsApi;
