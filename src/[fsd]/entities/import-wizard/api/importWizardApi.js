import {
  TAG_TYPE_APPLICATIONS,
  TAG_TYPE_DATA_SOURCES,
  TAG_TYPE_TOTAL_APPLICATIONS,
  TAG_TYPE_TOTAL_DATASOURCES,
  eliteaApi,
} from '@/api';

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
        invalidatesTags: [
          TAG_TYPE_DATA_SOURCES,
          TAG_TYPE_TOTAL_DATASOURCES,
          TAG_TYPE_APPLICATIONS,
          TAG_TYPE_TOTAL_APPLICATIONS,
        ],
      }),

      forkDatasource: build.mutation({
        query: ({ projectId, body }) => ({
          url: `datasources/fork/prompt_lib/${projectId}`,
          method: 'POST',
          headers,
          body,
        }),
        invalidatesTags: [],
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

export const { useImportWizardMutation, useForkDatasourceMutation, useForkAgentMutation } = importWizardApi;
