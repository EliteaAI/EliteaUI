import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/secrets';
const TAG_TYPE_SECRETS = 'SECRETS';

export const apis = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_SECRETS],
  })
  .injectEndpoints({
    endpoints: build => ({
      secretsList: build.query({
        query: projectId => ({
          url: apiSlicePath + '/secrets/default/' + projectId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_SECRETS];
        },
      }),
      secretAdding: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/secrets/default/' + projectId,
            method: 'POST',
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_SECRETS];
        },
      }),
      secretEditing: build.mutation({
        query: ({ projectId, name, ...body }) => {
          return {
            url: apiSlicePath + '/secret/default/' + projectId + '/' + name,
            method: 'PUT',
            body,
          };
        },
      }),
      secretDelete: build.mutation({
        query: ({ projectId, name }) => {
          return {
            url: apiSlicePath + '/secret/default/' + projectId + '/' + name,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_SECRETS];
        },
      }),
      secretShow: build.query({
        query: ({ projectId, name }) => ({
          url: apiSlicePath + '/secret/default/' + projectId + '/' + name,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_SECRETS];
        },
      }),
      secretHide: build.mutation({
        query: ({ projectId, name, ...body }) => {
          return {
            url: apiSlicePath + '/hide/default/' + projectId + '/' + name,
            method: 'POST',
            body,
          };
        },
      }),
    }),
  });

export const {
  useSecretsListQuery,
  useSecretAddingMutation,
  useSecretEditingMutation,
  useSecretDeleteMutation,
  useLazySecretShowQuery,
  useSecretHideMutation,
} = apis;
