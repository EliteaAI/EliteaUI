import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/elitea_core/project_context/prompt_lib';
const TAG_TYPE_PROJECT_CONTEXT = 'PROJECT_CONTEXT';

export const apis = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_PROJECT_CONTEXT],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectContext: build.query({
        query: projectId => ({
          url: `${apiSlicePath}/${projectId}/project-context`,
        }),
        providesTags: (result, error, projectId) => {
          if (error) return [];
          return [{ type: TAG_TYPE_PROJECT_CONTEXT, id: projectId }];
        },
      }),
      updateProjectContext: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: `${apiSlicePath}/${projectId}/project-context`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: (result, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_PROJECT_CONTEXT, id: projectId }];
        },
      }),
    }),
  });

export const { useProjectContextQuery, useUpdateProjectContextMutation } = apis;
