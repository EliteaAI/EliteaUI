import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';

const TAG_TYPE_PROJECT_INFO = 'PROJECT_INFO';
const TAG_TYPE_PROJECT_ICONS = 'PROJECT_ICONS';
const TAG_TYPE_CHAT_TEMPLATES = 'CHAT_TEMPLATES';

const projectInfoApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_PROJECT_INFO, TAG_TYPE_PROJECT_ICONS, TAG_TYPE_CHAT_TEMPLATES],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectInfo: build.query({
        query: ({ projectId, fields } = {}) => ({
          url: `${apiSlicePath}/project_info/prompt_lib/${projectId}/project-info`,
          params: fields ? { fields } : undefined,
        }),
        keepUnusedDataFor: 300,
        providesTags: (_, _error, { projectId } = {}) => {
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
      updateProjectChatConfig: build.mutation({
        query: ({ projectId, chat_config }) => ({
          url: `${apiSlicePath}/project_info/prompt_lib/${projectId}/project-info`,
          method: 'PUT',
          body: { chat_config },
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

      getChatTemplates: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/chat_templates/prompt_lib/${projectId}/templates`,
        }),
        providesTags: (_, _error, { projectId }) => [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }],
      }),

      createChatTemplate: build.mutation({
        query: ({ projectId, name, participants = [] }) => ({
          url: `${apiSlicePath}/chat_templates/prompt_lib/${projectId}/templates`,
          method: 'POST',
          body: { name, participants },
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }];
        },
      }),

      updateChatTemplate: build.mutation({
        query: ({ projectId, templateId, name, participants }) => ({
          url: `${apiSlicePath}/chat_templates/prompt_lib/${projectId}/templates/${templateId}`,
          method: 'PUT',
          body: { name, participants },
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }];
        },
      }),

      deleteChatTemplate: build.mutation({
        query: ({ projectId, templateId }) => ({
          url: `${apiSlicePath}/chat_templates/prompt_lib/${projectId}/templates/${templateId}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }];
        },
      }),

      setDefaultChatTemplate: build.mutation({
        query: ({ projectId, templateId }) => ({
          url: `${apiSlicePath}/chat_templates/prompt_lib/${projectId}/templates/${templateId}/set-default`,
          method: 'POST',
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }];
        },
      }),
    }),
  });

export const {
  useProjectInfoQuery,
  useLazyProjectInfoQuery,
  useUpdateProjectIconMutation,
  useUpdateProjectChatConfigMutation,
  useUploadProjectIconMutation,
  useGetProjectIconsQuery,
  useDeleteProjectIconMutation,
  useGetChatTemplatesQuery,
  useCreateChatTemplateMutation,
  useUpdateChatTemplateMutation,
  useDeleteChatTemplateMutation,
  useSetDefaultChatTemplateMutation,
} = projectInfoApi;
