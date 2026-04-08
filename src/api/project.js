import { PUBLIC_PROJECT_ID } from '@/common/constants.js';

import { eliteaApi } from './eliteaApi.js';

const TAG_TYPE_PROJECT = 'PROJECT';
const TAG_TYPE_PROJECT_GROUP = 'TAG_TYPE_PROJECT_GROUP';
const PROJECT_MODE = 'default';

export const projectApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_PROJECT],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectList: build.query({
        query: () => {
          return {
            url: '/projects/project/' + PROJECT_MODE + '/' + PUBLIC_PROJECT_ID,
            method: 'GET',
          };
        },
        providesTags: [TAG_TYPE_PROJECT],
      }),
      groupList: build.query({
        query: () => {
          return {
            url: '/projects/groups/prompt_lib',
            method: 'GET',
          };
        },
        providesTags: [TAG_TYPE_PROJECT_GROUP],
      }),
      putProjectGroups: build.mutation({
        query: ({ projectId, body }) => {
          return {
            url: '/projects/groups/prompt_lib/' + projectId,
            method: 'PUT',
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_PROJECT_GROUP, TAG_TYPE_PROJECT],
      }),
    }),
  });

export const {
  useProjectListQuery,
  useLazyProjectListQuery,
  useGroupListQuery,
  usePutProjectGroupsMutation,
} = projectApi;
