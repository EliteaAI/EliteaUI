import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';

// Exported so the publish/unpublish mutations (skillsApi) can invalidate the
// catalog cache — otherwise a skill published/unpublished from the editor leaves
// a stale card in an already-open ELITEA Catalog until a hard reload.
export const TAG_TYPE_PUBLIC_SKILLS = 'TAG_TYPE_PUBLIC_SKILLS';
export const TAG_TYPE_PUBLIC_SKILL_DETAILS = 'TAG_TYPE_PUBLIC_SKILL_DETAILS';
const TAG_TYPE_AGENTS_WITH_SKILL = 'TAG_TYPE_AGENTS_WITH_SKILL';

const apiSlicePath = '/elitea_core';
const apiSlicePathForLike = '/social/like/prompt_lib/';
const mode = 'prompt_lib';
const headers = {
  'Content-Type': 'application/json',
};

const SKILL_ENTITY_TYPE_AGENT = 'agent';

const skillHubApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_PUBLIC_SKILLS, TAG_TYPE_PUBLIC_SKILL_DETAILS, TAG_TYPE_AGENTS_WITH_SKILL],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Lazy list of published skills from the PUBLIC project. Shape: { total, rows }.
      publicSkillsList: build.query({
        query: ({ page = 0, params, pageSize = PAGE_SIZE }) => ({
          url: `${apiSlicePath}/public_skills/${mode}/`,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_PUBLIC_SKILLS],
        transformResponse: response => ({
          total: response?.total ?? (response?.rows?.length || 0),
          rows: response?.rows ?? [],
        }),
      }),
      getPublicSkillDetails: build.query({
        query: ({ skillId, versionName }) => {
          let url = `${apiSlicePath}/public_skill/${mode}/${skillId}`;
          if (versionName) {
            url += '/' + versionName;
          }
          return { url };
        },
        providesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_PUBLIC_SKILL_DETAILS, { type: TAG_TYPE_PUBLIC_SKILL_DETAILS, id: result?.id }];
        },
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),
      likeSkill: build.mutation({
        query: skillId => ({
          url: `${apiSlicePathForLike}${PUBLIC_PROJECT_ID}/skill/${skillId}`,
          method: 'POST',
        }),
        invalidatesTags: [TAG_TYPE_PUBLIC_SKILL_DETAILS],
      }),
      unlikeSkill: build.mutation({
        query: skillId => ({
          url: `${apiSlicePathForLike}${PUBLIC_PROJECT_ID}/skill/${skillId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_TYPE_PUBLIC_SKILL_DETAILS],
      }),
      // Agents (in the CURRENT project) that already have this PUBLIC skill attached.
      agentsWithSkill: build.query({
        query: ({ projectId, publicSkillId }) => ({
          url: `${apiSlicePath}/agents_with_skill/${mode}/${projectId}/${publicSkillId}`,
        }),
        providesTags: (result, error, arg) => [{ type: TAG_TYPE_AGENTS_WITH_SKILL, id: arg?.publicSkillId }],
        transformResponse: response => ({
          total: response?.total ?? (response?.rows?.length || 0),
          rows: response?.rows ?? [],
        }),
      }),
      // Attach a PUBLIC skill to one or more agents in the current project in a single call.
      // Response: { results: [{ agent_version_id, ok, error?, http_status? }] } (HTTP 200 even on partial failure).
      attachPublicSkill: build.mutation({
        query: ({ projectId, publicSkillId, publicVersionId, agentVersionIds }) => ({
          url: `${apiSlicePath}/attach_public_skill/${mode}/${projectId}`,
          method: 'POST',
          headers,
          body: {
            public_skill_id: publicSkillId,
            public_version_id: publicVersionId,
            agent_version_ids: agentVersionIds,
            entity_type: SKILL_ENTITY_TYPE_AGENT,
          },
        }),
        invalidatesTags: (result, error, arg) => {
          if (error) return [];
          return [{ type: TAG_TYPE_AGENTS_WITH_SKILL, id: arg?.publicSkillId }];
        },
      }),
    }),
  });

export const {
  useLazyPublicSkillsListQuery,
  useGetPublicSkillDetailsQuery,
  useLikeSkillMutation,
  useUnlikeSkillMutation,
  useAgentsWithSkillQuery,
  useLazyAgentsWithSkillQuery,
  useAttachPublicSkillMutation,
} = skillHubApi;
