import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';
import { eliteaApi } from '@/api';
import {
  TAG_AVAILABLE_CONFIGURATIONS,
  TAG_CONFIGURATIONS,
  TAG_CONFIGURATION_DETAILS,
  TAG_SHARED_CONFIGURATIONS,
} from '@/api/configurations';

const { CHAT_TAG_TYPES, PROJECT_ENTITY_TAG_TYPES } = ProjectBackupConstants;

const CONFIGURATION_TAG_TYPES = [
  TAG_CONFIGURATIONS,
  TAG_CONFIGURATION_DETAILS,
  TAG_AVAILABLE_CONFIGURATIONS,
  TAG_SHARED_CONFIGURATIONS,
];

// Everything a bulk delete can remove; partial deletes change it too, so any answer refetches it
const DELETED_DATA_TAG_TYPES = [...CHAT_TAG_TYPES, ...PROJECT_ENTITY_TAG_TYPES, ...CONFIGURATION_TAG_TYPES];

const apiSlicePath = '/admin';
const TAG_TYPE_PROJECT_DATA_SUMMARY = 'TAG_TYPE_PROJECT_DATA_SUMMARY';

const projectDataDeleteApi = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_TYPE_PROJECT_DATA_SUMMARY, ...DELETED_DATA_TAG_TYPES] })
  .injectEndpoints({
    endpoints: build => ({
      projectDataSummary: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/project_data_delete/prompt_lib/${projectId}`,
        }),
        providesTags: [TAG_TYPE_PROJECT_DATA_SUMMARY],
      }),
      deleteProjectData: build.mutation({
        query: ({ projectId, types }) => ({
          url: `${apiSlicePath}/project_data_delete/prompt_lib/${projectId}`,
          method: 'POST',
          body: { types },
        }),
        invalidatesTags: [TAG_TYPE_PROJECT_DATA_SUMMARY, ...DELETED_DATA_TAG_TYPES],
      }),
    }),
  });

export const { useProjectDataSummaryQuery, useDeleteProjectDataMutation } = projectDataDeleteApi;

export default projectDataDeleteApi;
