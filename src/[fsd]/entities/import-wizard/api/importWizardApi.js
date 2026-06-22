import { TAG_TYPE_APPLICATIONS, TAG_TYPE_TOTAL_APPLICATIONS, eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';

const headers = {
  'Content-Type': 'application/json',
};

export const importWizardApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [],
  })
  .injectEndpoints({
    endpoints: build => ({
      importWizard: build.mutation({
        query: ({ projectId, body }) => ({
          url: `${apiSlicePath}/import_wizard/prompt_lib/${projectId}`,
          method: 'POST',
          headers,
          body,
        }),
        invalidatesTags: [TAG_TYPE_APPLICATIONS, TAG_TYPE_TOTAL_APPLICATIONS],
      }),

      forkAgent: build.mutation({
        query: ({ projectId, body }) => ({
          url: `${apiSlicePath}/fork/prompt_lib/${projectId}`,
          method: 'POST',
          headers,
          body,
        }),
        invalidatesTags: [],
      }),
    }),
  });

export const { useImportWizardMutation, useForkAgentMutation } = importWizardApi;
