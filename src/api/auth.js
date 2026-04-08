import { PUBLIC_PROJECT_ID } from '@/common/constants';

import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/auth';
const TAG_TYPE_AUTH = 'Auth';
const TAG_TYPE_PUBLIC_PERMISSIONS = 'PERMISSION_LIST';
const TAG_TYPE_PERMISSIONS = 'PERMISSION_LIST';
const TAG_TYPE_TOKENS = 'TAG_TYPE_TOKENS';

export const apis = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_AUTH, TAG_TYPE_PERMISSIONS],
  })
  .injectEndpoints({
    endpoints: build => ({
      publicPermissionList: build.query({
        query: () => ({
          url: apiSlicePath + '/permissions/prompt_lib/' + PUBLIC_PROJECT_ID,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_PUBLIC_PERMISSIONS];
        },
      }),
      permissionList: build.query({
        query: projectId => ({
          url: apiSlicePath + '/permissions/prompt_lib/' + projectId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_PERMISSIONS];
        },
      }),
      checkPermissionList: build.query({
        query: projectId => ({
          url: apiSlicePath + '/permissions/prompt_lib/' + projectId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_PERMISSIONS];
        },
      }),

      tokenList: build.query({
        query: () => ({
          url: apiSlicePath + '/token/',
        }),
        providesTags: [TAG_TYPE_TOKENS],
      }),

      tokenCreate: build.mutation({
        query: body => {
          return {
            url: apiSlicePath + '/token/',
            method: 'POST',
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_TOKENS],
      }),

      tokenDelete: build.mutation({
        query: ({ uuid }) => {
          return {
            url: apiSlicePath + '/token/' + uuid,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOKENS],
      }),
    }),
  });

export const {
  usePermissionListQuery,
  useLazyPermissionListQuery,
  useLazyPublicPermissionListQuery,
  useLazyCheckPermissionListQuery,
  useTokenListQuery,
  useTokenCreateMutation,
  useTokenDeleteMutation,
} = apis;
