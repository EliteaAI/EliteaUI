import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { getFilenameFromContentDisposition } from '@/[fsd]/shared/lib/helpers';
import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE } from '@/common/constants';
import { convertToJson, removeDuplicateObjects } from '@/common/utils.jsx';

const TAG_TYPE_SKILLS = 'TAG_TYPE_SKILLS';
const TAG_TYPE_SKILL_DETAILS = 'TAG_TYPE_SKILL_DETAILS';
const TAG_TYPE_TOTAL_SKILLS = 'TAG_TYPE_TOTAL_SKILLS';
const TAG_TYPE_APPLICATION_SKILLS = 'TAG_TYPE_APPLICATION_SKILLS';
const TAG_TYPE_SKILL_ICONS = 'TAG_TYPE_SKILL_ICONS';

const SKILL_ENTITY_TYPE_AGENT = 'agent';

const apiSlicePath = '/elitea_core';
const mode = 'prompt_lib';
const headers = {
  'Content-Type': 'application/json',
};

// Optimistically remove a skill from every cached skill list query.
const patchSkillListCache = (state, dispatch, endpointName, skillId) => {
  const {
    eliteaApi: { queries },
  } = state;
  const cacheKeys = Object.keys(queries || {});
  const patchResults = [];

  const foundKeys = cacheKeys.filter(key => queries[key].endpointName === endpointName);

  foundKeys.forEach(key => {
    const queryParams = key.replace(endpointName, '');
    const patchResult = dispatch(
      eliteaApi.util.updateQueryData(endpointName, convertToJson(queryParams), draft => {
        const index = draft.rows.findIndex(item => item.id === skillId);
        if (index !== -1) {
          draft.rows.splice(index, 1);
        }
      }),
    );
    patchResults.push(patchResult);
  });

  return patchResults;
};

const skillsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [
      TAG_TYPE_SKILLS,
      TAG_TYPE_SKILL_DETAILS,
      TAG_TYPE_TOTAL_SKILLS,
      TAG_TYPE_APPLICATION_SKILLS,
      TAG_TYPE_SKILL_ICONS,
    ],
  })
  .injectEndpoints({
    endpoints: build => ({
      skillList: build.query({
        query: ({ projectId, page = 0, params, pageSize = PAGE_SIZE }) => ({
          url: `${apiSlicePath}/skills/${mode}/${projectId}`,
          params: {
            sort_by: 'created_at',
            sort_order: 'desc',
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_SKILLS],
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([...currentCache.rows, ...newItems.rows]);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      totalSkills: build.query({
        query: ({ projectId, params }) => ({
          url: `${apiSlicePath}/skills/${mode}/${projectId}`,
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_SKILLS],
      }),
      skillCreate: build.mutation({
        query: ({ projectId, name, description, instructions, versions }) => {
          const body = {
            name,
            description,
            versions: versions || [{ name: LATEST_VERSION_NAME, instructions }],
          };
          return {
            url: `${apiSlicePath}/skills/${mode}/${projectId}`,
            method: 'POST',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_SKILLS, TAG_TYPE_TOTAL_SKILLS];
        },
      }),
      skillDetails: build.query({
        query: ({ projectId, skillId, versionId }) => {
          let url = `${apiSlicePath}/skill/${mode}/${projectId}/${skillId}`;
          if (versionId) {
            url += '/' + versionId;
          }
          return { url };
        },
        providesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_SKILL_DETAILS, { type: TAG_TYPE_SKILL_DETAILS, id: result?.id }];
        },
        // Only keep one cacheEntry marked by the query's endpointName
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
      skillCreateVersion: build.mutation({
        // body: { name (NOT 'base'), instructions, tags?, meta? } -> 201
        query: ({ projectId, skillId, name, instructions, tags, meta }) => {
          const body = { name, instructions };
          if (tags) {
            body.tags = tags;
          }
          if (meta) {
            body.meta = meta;
          }
          return {
            url: `${apiSlicePath}/skill/${mode}/${projectId}/${skillId}`,
            method: 'POST',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, arg) => {
          if (error) return [];
          return [
            TAG_TYPE_SKILLS,
            TAG_TYPE_SKILL_DETAILS,
            { type: TAG_TYPE_SKILL_DETAILS, id: arg?.skillId },
          ];
        },
      }),
      skillUpdate: build.mutation({
        // Update skill metadata (no versionId) OR a version's content (with versionId).
        query: ({ projectId, skillId, versionId, ...body }) => {
          let url = `${apiSlicePath}/skill/${mode}/${projectId}/${skillId}`;
          if (versionId) {
            url += '/' + versionId;
          }
          return {
            url,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, arg) => {
          if (error) return [];
          return [
            TAG_TYPE_SKILLS,
            TAG_TYPE_SKILL_DETAILS,
            { type: TAG_TYPE_SKILL_DETAILS, id: arg?.skillId },
          ];
        },
      }),
      deleteSkill: build.mutation({
        // Delete the whole skill (204) or a single version when versionId is given.
        query: ({ projectId, skillId, versionId }) => {
          let url = `${apiSlicePath}/skill/${mode}/${projectId}/${skillId}`;
          if (versionId) {
            url += '/' + versionId;
          }
          return {
            url,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error, arg) => {
          if (error) return [];
          return [TAG_TYPE_SKILLS, TAG_TYPE_TOTAL_SKILLS, { type: TAG_TYPE_SKILL_DETAILS, id: arg?.skillId }];
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          // Only optimistically remove from list when deleting the whole skill.
          if (args.versionId) {
            try {
              await queryFulfilled;
            } catch {
              // no-op
            }
            return;
          }
          const state = getState();
          const patchResults = patchSkillListCache(state, dispatch, 'skillList', args.skillId);

          try {
            await queryFulfilled;
          } catch {
            patchResults.forEach(patch => patch.undo());
          }
        },
      }),
      // Set the default version of a skill -> returns the updated skill details.
      setSkillDefaultVersion: build.mutation({
        query: ({ projectId, skillId, versionId }) => ({
          url: `${apiSlicePath}/skill_default_version/${mode}/${projectId}/${skillId}`,
          method: 'PATCH',
          headers,
          body: { version_id: versionId },
        }),
        invalidatesTags: (result, error, arg) => {
          if (error) return [];
          return [
            TAG_TYPE_SKILLS,
            TAG_TYPE_SKILL_DETAILS,
            { type: TAG_TYPE_SKILL_DETAILS, id: arg?.skillId },
          ];
        },
      }),
      // Export the selected version as a .md file (YAML frontmatter + markdown body).
      skillExportMd: build.query({
        query: ({ projectId, skillId, versionId }) => {
          let url = `${apiSlicePath}/skill_export/${mode}/${projectId}/${skillId}`;
          if (versionId) {
            url += '/' + versionId;
          }
          return {
            url,
            responseHandler: async response => {
              const contentType = response.headers.get('content-type') || '';
              const contentDisposition = response.headers.get('content-disposition') || '';

              // Extract filename from content-disposition header
              const filename = getFilenameFromContentDisposition(contentDisposition, 'skill.md');

              const blob = await response.blob();
              return { blob, filename, contentType };
            },
          };
        },
        providesTags: [],
      }),
      // Import a skill from a .md file (multipart 'file') OR json { content, filename }.
      // ONLY .md is accepted; wrong extension -> 400 { error }. Duplicate name -> reused + { notice }.
      skillImport: build.mutation({
        query: ({ projectId, file, content, filename }) => {
          if (file) {
            const form = new FormData();
            form.append('file', file);
            return {
              url: `${apiSlicePath}/skill_import/${mode}/${projectId}`,
              method: 'POST',
              body: form,
              formData: true,
            };
          }
          return {
            url: `${apiSlicePath}/skill_import/${mode}/${projectId}`,
            method: 'POST',
            headers,
            body: { content, filename },
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_SKILLS, TAG_TYPE_TOTAL_SKILLS];
        },
      }),
      // Attach/detach a skill to an agent (application) version via has_relation toggle.
      // has_relation:true -> attach (skill_version_id REQUIRED); false -> detach.
      updateSkillRelation: build.mutation({
        query: ({
          projectId,
          skillId,
          entity_version_id,
          skill_version_id,
          has_relation,
          entity_type = SKILL_ENTITY_TYPE_AGENT,
        }) => ({
          url: `${apiSlicePath}/skill/${mode}/${projectId}/${skillId}`,
          method: 'PATCH',
          headers,
          body: {
            has_relation,
            entity_version_id,
            skill_version_id,
            entity_type,
          },
        }),
        invalidatesTags: (result, error, arg) => {
          if (error) return [];
          return [TAG_TYPE_SKILLS, { type: TAG_TYPE_APPLICATION_SKILLS, id: arg?.entity_version_id }];
        },
      }),
      // List the skills attached to an agent (application) version.
      getApplicationSkills: build.query({
        query: ({ projectId, appVersionId }) => ({
          url: `${apiSlicePath}/application_skills/${mode}/${projectId}/${appVersionId}`,
        }),
        providesTags: (result, error, arg) => [{ type: TAG_TYPE_APPLICATION_SKILLS, id: arg?.appVersionId }],
      }),
      // Skill icon gallery + upload/replace/delete (mirrors the application icon endpoints).
      getSkillIcons: build.query({
        query: ({ projectId, page, pageSize = PAGE_SIZE }) => ({
          url: `${apiSlicePath}/upload_skill_icon/${mode}/${projectId}`,
          params: {
            limit: pageSize,
            skip: page * pageSize,
          },
        }),
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([...currentCache.rows, ...newItems.rows]);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
        providesTags: [TAG_TYPE_SKILL_ICONS],
      }),
      uploadSkillIcon: build.mutation({
        query: ({ projectId, versionId, files, width, height }) => {
          const form = new FormData();
          if (files?.length) {
            for (let i = 0; i < files.length; i++) {
              form.append('file', files[i]);
            }
            form.append('width', width);
            form.append('height', height);
          }
          return {
            url:
              apiSlicePath +
              (versionId
                ? `/upload_skill_icon/${mode}/${projectId}/${versionId}`
                : `/upload_skill_icon/${mode}/${projectId}`),
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_SKILL_ICONS];
        },
      }),
      replaceSkillIcon: build.mutation({
        // eslint-disable-next-line no-unused-vars
        query: ({ projectId, versionId, entityId, ...body }) => {
          return {
            url: `${apiSlicePath}/upload_skill_icon/${mode}/${projectId}/${versionId}`,
            method: 'PUT',
            headers,
            body,
          };
        },
        // List/SkillCard/mention surfaces show the version icon — refetch them.
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_SKILLS, TAG_TYPE_APPLICATION_SKILLS];
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          // eslint-disable-next-line no-unused-vars
          const { projectId, versionId, entityId, ...icon_meta } = args;
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult = null;
          const foundSkillDetailKey = cacheKeys.find(
            key => queries[key].endpointName === 'skillDetails' && key.includes(entityId),
          );
          if (foundSkillDetailKey) {
            const queryParams = foundSkillDetailKey.replace('skillDetails', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('skillDetails', convertToJson(queryParams), draft => {
                draft.version_details.meta = {
                  ...(draft.version_details.meta || {}),
                  icon_meta,
                };
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult?.undo();
          }
        },
      }),
      deleteSkillIcon: build.mutation({
        query: ({ projectId, name }) => {
          return {
            url: `${apiSlicePath}/upload_skill_icon/${mode}/${projectId}/${name}`,
            method: 'DELETE',
          };
        },
        // Deliberately NOT invalidating TAG_TYPE_SKILL_DETAILS: the open Edit Skill
        // form subscribes to skillDetails with enableReinitialize — a refetch with
        // the unlinked icon would reset Formik and destroy unsaved edits.
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_SKILLS, TAG_TYPE_APPLICATION_SKILLS];
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const { name } = args;
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult = null;
          const foundKey = cacheKeys.find(key => queries[key].endpointName === 'getSkillIcons');
          if (foundKey) {
            const queryParams = foundKey.replace('getSkillIcons', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('getSkillIcons', convertToJson(queryParams), draft => {
                draft.rows = draft.rows.filter(icon => icon.name !== name);
                draft.total = draft.total - 1;
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult?.undo();
          }
        },
      }),
    }),
  });

export const {
  useSkillListQuery,
  useLazySkillListQuery,
  useTotalSkillsQuery,
  useSkillCreateMutation,
  useSkillDetailsQuery,
  useLazySkillDetailsQuery,
  useSkillCreateVersionMutation,
  useSkillUpdateMutation,
  useDeleteSkillMutation,
  useSetSkillDefaultVersionMutation,
  useLazySkillExportMdQuery,
  useSkillImportMutation,
  useUpdateSkillRelationMutation,
  useGetApplicationSkillsQuery,
  useLazyGetApplicationSkillsQuery,
  useGetSkillIconsQuery,
  useUploadSkillIconMutation,
  useReplaceSkillIconMutation,
  useDeleteSkillIconMutation,
} = skillsApi;
