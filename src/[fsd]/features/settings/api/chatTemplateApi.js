import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';
export const TAG_TYPE_CHAT_TEMPLATES = 'CHAT_TEMPLATES';

const chatTemplateApi = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_TYPE_CHAT_TEMPLATES] })
  .injectEndpoints({
    endpoints: build => ({
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
          url: `${apiSlicePath}/chat_template_default/prompt_lib/${projectId}/templates/${templateId}/set-default`,
          method: 'POST',
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }];
        },
      }),

      unsetDefaultChatTemplate: build.mutation({
        query: ({ projectId, templateId }) => ({
          url: `${apiSlicePath}/chat_template_default/prompt_lib/${projectId}/templates/${templateId}/set-default`,
          method: 'DELETE',
        }),
        invalidatesTags: (_, error, { projectId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CHAT_TEMPLATES, id: projectId }];
        },
      }),
    }),
  });

export const {
  useGetChatTemplatesQuery,
  useCreateChatTemplateMutation,
  useUpdateChatTemplateMutation,
  useDeleteChatTemplateMutation,
  useSetDefaultChatTemplateMutation,
  useUnsetDefaultChatTemplateMutation,
} = chatTemplateApi;
