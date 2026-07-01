import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';

const TAG_TYPE_PROJECT_INFO = 'PROJECT_INFO';
const TAG_TYPE_PROJECT_ICONS = 'PROJECT_ICONS';

const projectInfoApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_PROJECT_INFO, TAG_TYPE_PROJECT_ICONS],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectInfo: build.query({
        query: projectId => ({
          url: `${apiSlicePath}/project_info/prompt_lib/${projectId}/project-info`,
        }),
        providesTags: (_, error, projectId) => {
          if (error) return [];
          return [{ type: TAG_TYPE_PROJECT_INFO, id: projectId }];
        },
      }),
      updateProjectIcon: build.mutation({
        query: ({ projectId, icon_meta }) => ({
          url: `${apiSlicePath}/project_info/prompt_lib/${projectId}/project-info`,
          method: 'PUT',
          body: { icon_meta },
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_PROJECT_INFO, id: projectId }];
        },
      }),
      uploadProjectIcon: build.mutation({
        query: ({ projectId, files, width, height }) => {
          const form = new FormData();

          if (files?.length) {
            for (let i = 0; i < files.length; i++) {
              form.append('file', files[i]);
            }
            form.append('width', width);
            form.append('height', height);
          }

          return {
            url: `${apiSlicePath}/project_icon/prompt_lib/${projectId}`,
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [
            { type: TAG_TYPE_PROJECT_ICONS, id: projectId },
            { type: TAG_TYPE_PROJECT_INFO, id: projectId },
          ];
        },
      }),
      getProjectIcons: build.query({
        query: ({ projectId, page = 0, pageSize = 200 }) => ({
          url: `${apiSlicePath}/project_icon/prompt_lib/${projectId}`,
          params: {
            limit: pageSize,
            skip: page * pageSize,
          },
        }),
        providesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_PROJECT_ICONS, id: projectId }];
        },
      }),
      deleteProjectIcon: build.mutation({
        query: ({ projectId, name }) => ({
          url: `${apiSlicePath}/project_icon/prompt_lib/${projectId}/${name}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_PROJECT_ICONS, id: projectId }];
        },
      }),
    }),
  });

export const {
  useProjectInfoQuery,
  useUpdateProjectIconMutation,
  useUploadProjectIconMutation,
  useGetProjectIconsQuery,
  useDeleteProjectIconMutation,
} = projectInfoApi;
