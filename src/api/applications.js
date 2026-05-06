import { PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';
import { convertToJson, removeDuplicateObjects } from '@/common/utils.jsx';

import { eliteaApi } from './eliteaApi.js';

export const TAG_TYPE_APPLICATIONS = 'TAG_TYPE_APPLICATIONS';
const TAG_TYPE_PUBLIC_APPLICATIONS = 'TAG_TYPE_PUBLIC_APPLICATIONS';
export const TAG_TYPE_APPLICATION_DETAILS = 'TAG_TYPE_APPLICATION_DETAILS';
const TAG_TYPE_SELECTED_APPLICATION_DETAILS = 'TAG_TYPE_SELECTED_APPLICATION_DETAILS';
export const TAG_TYPE_TOTAL_APPLICATIONS = 'TAG_TYPE_TOTAL_APPLICATIONS';
const TAG_TYPE_TOTAL_PUBLIC_APPLICATIONS = 'TAG_TYPE_TOTAL_PUBLIC_APPLICATIONS';
const TAG_TYPE_TOTAL_MY_LIKED_PUBLIC_APPLICATIONS = 'TAG_TYPE_TOTAL_MY_LIKED_PUBLIC_APPLICATIONS';
const TAG_TYPE_TOTAL_TRENDING_PUBLIC_APPLICATIONS = 'TAG_TYPE_TOTAL_TRENDING_PUBLIC_APPLICATIONS';
const TAG_TYPE_APPLICATION_DEFAULT_ICONS = 'TAG_TYPE_APPLICATION_DEFAULT_ICONS';
const TAG_TYPE_APPLICATION_ICONS = 'TAG_TYPE_APPLICATION_ICONS';
const TAG_TYPE_DOCUMENT_LOADERS = 'TAG_TYPE_DOCUMENT_LOADERS';
const apiSlicePath = '/elitea_core';
const apiSlicePathForModeration = '/prompt_lib';
const apiSlicePathForLike = '/social/like/prompt_lib/';
const headers = {
  'Content-Type': 'application/json',
};

const patchApplicationListCache = (state, dispatch, endpointName, applicationId) => {
  const {
    eliteaApi: { queries },
  } = state;
  const cacheKeys = Object.keys(queries || {});
  const patchResults = [];

  const foundKeys = cacheKeys.filter(key => queries[key].endpointName === endpointName);

  foundKeys.forEach(key => {
    const queryParams = key.replace(endpointName, '');
    const patchResult = dispatch(
      eliteaApi.util.updateQueryData(endpointName, convertToJson(queryParams), draft => {
        const index = draft.rows.findIndex(item => item.id === applicationId);
        if (index !== -1) {
          draft.rows.splice(index, 1);
        }
      }),
    );
    patchResults.push(patchResult);
  });

  return patchResults;
};

export const apiSlice = eliteaApi
  .enhanceEndpoints({
    //
    addTagTypes: [TAG_TYPE_APPLICATION_DETAILS],
  })
  .injectEndpoints({
    endpoints: build => ({
      applicationList: build.query({
        query: ({ projectId, page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/applications/prompt_lib/' + projectId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_APPLICATIONS],
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([...currentCache.rows, ...newItems.rows]);
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      totalApplications: build.query({
        query: ({ projectId, params }) => ({
          url: apiSlicePath + '/applications/prompt_lib/' + projectId,
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_APPLICATIONS],
      }),
      publicApplicationsList: build.query({
        query: ({ page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/public_applications/prompt_lib/',
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_PUBLIC_APPLICATIONS],
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([...currentCache.rows, ...newItems.rows]);
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      totalPublicApplications: build.query({
        query: ({ params }) => ({
          url: apiSlicePath + '/public_applications/prompt_lib',
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_PUBLIC_APPLICATIONS],
      }),
      totalMyLikedPublicApplications: build.query({
        query: ({ params }) => ({
          url: apiSlicePath + '/public_applications/prompt_lib',
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_MY_LIKED_PUBLIC_APPLICATIONS],
      }),
      totalTrendingPublicApplications: build.query({
        query: ({ params }) => ({
          url: apiSlicePath + '/public_applications/prompt_lib',
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_TRENDING_PUBLIC_APPLICATIONS],
      }),
      likeApplication: build.mutation({
        query: applicationId => {
          return {
            url: apiSlicePathForLike + PUBLIC_PROJECT_ID + '/application/' + applicationId,
            method: 'POST',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_PUBLIC_APPLICATIONS, TAG_TYPE_APPLICATION_DETAILS],
      }),
      unlikeApplication: build.mutation({
        query: applicationId => {
          return {
            url: apiSlicePathForLike + PUBLIC_PROJECT_ID + '/application/' + applicationId,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_PUBLIC_APPLICATIONS, TAG_TYPE_APPLICATION_DETAILS],
      }),
      applicationCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          // TODO: use FormData to support image upload
          // const form = new FormData()

          // if (body?.icon) {
          //   form.append('icon', body.icon)
          //   delete body.icon
          // }

          // form.append('data', JSON.stringify(body))

          // return ({
          //   url: apiSlicePath + '/applications/prompt_lib/' + projectId + '?is_form=true',
          //   method: 'POST',
          //   body: form,
          //   formData: true
          // });
          return {
            url: apiSlicePath + '/applications/prompt_lib/' + projectId,
            method: 'POST',
            headers,
            body,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_APPLICATION_DETAILS, { type: TAG_TYPE_APPLICATION_DETAILS, id: result?.id }];
        },
        invalidatesTags: [TAG_TYPE_TOTAL_APPLICATIONS, TAG_TYPE_APPLICATIONS],
      }),
      applicationEdit: build.mutation({
        query: ({ projectId, id, ...body }) => {
          // TODO: use FormData to support image upload
          // const form = new FormData()

          // if (body?.file) {
          //   form.append('file', body.file)
          //   delete body.file
          // }

          // form.append('data', JSON.stringify(body))

          // return ({
          //   url: apiSlicePath + '/application/prompt_lib/' + projectId + '/' + body.id + '?is_form=true',
          //   method: 'PUT',
          //   body: form,
          //   formData: true
          // });
          return {
            url: apiSlicePath + '/application/prompt_lib/' + projectId + '/' + id,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_APPLICATIONS],
      }),
      deleteApplication: build.mutation({
        query: ({ projectId, applicationId }) => {
          return {
            url: apiSlicePath + '/application/prompt_lib/' + projectId + '/' + applicationId,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_APPLICATIONS, TAG_TYPE_APPLICATIONS],
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const state = getState();
          const patchResults = [
            ...patchApplicationListCache(state, dispatch, 'applicationList', args.applicationId),
            ...patchApplicationListCache(state, dispatch, 'publicApplicationsList', args.applicationId),
          ];

          try {
            await queryFulfilled;
          } catch {
            patchResults.forEach(patch => patch.undo());
          }
        },
      }),
      deleteApplicationTool: build.mutation({
        query: ({ projectId, toolId }) => {
          return {
            url: apiSlicePath + '/tool/prompt_lib/' + projectId + '/' + toolId,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_APPLICATIONS, TAG_TYPE_APPLICATIONS],
      }),
      publishApplication: build.mutation({
        query: ({ projectId, versionId, body }) => {
          return {
            url: apiSlicePath + '/publish/prompt_lib/' + projectId + '/' + versionId,
            method: 'POST',
            body,
          };
        },
        invalidatesTags: (result, error, arg) => {
          if (error) {
            return [];
          }
          return [{ type: TAG_TYPE_APPLICATION_DETAILS, id: arg.id }, TAG_TYPE_APPLICATIONS];
        },
      }),
      unpublishApplication: build.mutation({
        query: ({ projectId, versionId, body }) => {
          return {
            url: apiSlicePath + '/unpublish/prompt_lib/' + projectId + '/' + versionId,
            method: 'POST',
            body,
          };
        },
        invalidatesTags: (result, error, arg) => {
          if (error) {
            return [];
          }
          return [{ type: TAG_TYPE_APPLICATION_DETAILS, id: arg.id }, TAG_TYPE_APPLICATIONS];
        },
      }),
      validateForPublish: build.mutation({
        query: ({ projectId, versionId, body }) => {
          return {
            url: apiSlicePath + '/publish_validate/prompt_lib/' + projectId + '/' + versionId,
            method: 'POST',
            body,
          };
        },
        invalidatesTags: [],
      }),
      stopApplicationTask: build.mutation({
        query: ({ projectId, task_id }) => {
          return {
            url: apiSlicePath + '/application_task/prompt_lib/' + projectId + '/' + task_id,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
      }),
      applicationDetails: build.query({
        query: ({ projectId, applicationId }) => {
          const url = apiSlicePath + '/application/prompt_lib/' + projectId + '/' + applicationId;
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_APPLICATION_DETAILS, { type: TAG_TYPE_APPLICATION_DETAILS, id: result?.id }];
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),
      forkedFromApplicationDetails: build.query({
        query: ({ projectId, applicationId }) => {
          const url = apiSlicePath + '/application/prompt_lib/' + projectId + '/' + applicationId;
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_APPLICATION_DETAILS, { type: TAG_TYPE_APPLICATION_DETAILS, id: result?.id }];
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),
      applicationSelectItemDetails: build.query({
        query: ({ projectId, applicationId }) => {
          const url = apiSlicePath + '/application/prompt_lib/' + projectId + '/' + applicationId;
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [
            TAG_TYPE_SELECTED_APPLICATION_DETAILS,
            { type: TAG_TYPE_SELECTED_APPLICATION_DETAILS, id: result?.id },
          ];
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),
      publicApplicationDetails: build.query({
        query: ({ applicationId, versionName }) => {
          let url = apiSlicePath + '/public_application/prompt_lib/' + applicationId;
          if (versionName) {
            url += '/' + versionName;
          }
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_APPLICATION_DETAILS, { type: TAG_TYPE_APPLICATION_DETAILS, id: result?.id }];
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),
      getApplicationVersionDetail: build.query({
        query: ({ projectId, applicationId, versionId }) => ({
          url: apiSlicePath + '/version/prompt_lib/' + projectId + '/' + applicationId + '/' + versionId,
          method: 'GET',
        }),
        providesTags: (result, error, { projectId, applicationId, versionId }) => [
          { type: TAG_TYPE_APPLICATION_DETAILS, id: `${projectId}_${applicationId}_${versionId}` },
        ],
      }),
      saveApplicationNewVersion: build.mutation({
        query: ({ projectId, applicationId, ...body }) => {
          return {
            url: apiSlicePath + '/versions/prompt_lib/' + projectId + '/' + applicationId,
            method: 'POST',
            headers,
            body,
          };
        },
        invalidatesTags: [],
      }),
      updateApplicationVersion: build.mutation({
        query: ({ projectId, applicationId, versionId, ...body }) => {
          return {
            url: apiSlicePath + '/version/prompt_lib/' + projectId + '/' + applicationId + '/' + versionId,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_APPLICATIONS], // Only invalidate applications list, not details
        onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
          // Optimistic update for version fields (e.g., conversation starters, description, etc.)
          const { projectId, applicationId, versionId, ...body } = args;
          let patchResult;
          if (projectId && applicationId && versionId) {
            patchResult = dispatch(
              eliteaApi.util.updateQueryData(
                'getApplicationVersionDetail',
                { projectId, applicationId, versionId },
                draft => {
                  Object.entries(body).forEach(([key, value]) => {
                    draft[key] = value;
                  });
                },
              ),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult?.undo();
          }
        },
      }),
      setApplicationDefaultVersion: build.mutation({
        query: ({ projectId, applicationId, version_id }) => {
          return {
            url: `${apiSlicePath}/default_version/prompt_lib/${projectId}/${applicationId}`,
            method: 'PATCH',
            headers,
            body: {
              version_id,
            },
          };
        },
        invalidatesTags: (_, error, arg) => {
          if (error) return [];

          return [
            { type: TAG_TYPE_APPLICATION_DETAILS, id: arg.applicationId },
            TAG_TYPE_APPLICATION_DETAILS,
          ];
        },
      }),
      deleteApplicationVersion: build.mutation({
        query: ({ projectId, applicationId, versionId, replacementVersionId }) => {
          const params = replacementVersionId ? `?replacement_version_id=${replacementVersionId}` : '';
          return {
            url:
              apiSlicePath +
              '/version/prompt_lib/' +
              projectId +
              '/' +
              applicationId +
              '/' +
              versionId +
              params,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_APPLICATION_DETAILS, TAG_TYPE_APPLICATIONS],
      }),
      checkVersionInUse: build.query({
        query: ({ projectId, applicationId, versionId }) => ({
          url:
            apiSlicePath +
            '/check_version_in_use/prompt_lib/' +
            projectId +
            '/' +
            applicationId +
            '/' +
            versionId,
          method: 'GET',
        }),
      }),
      batchReplaceVersionReferences: build.mutation({
        query: ({ projectId, oldVersionId, newVersionId, deleteOld = true }) => {
          const deleteParam = deleteOld ? '?delete_old=true' : '?delete_old=false';
          return {
            url:
              apiSlicePath +
              '/batch_replace_version/prompt_lib/' +
              projectId +
              '/' +
              oldVersionId +
              '/' +
              newVersionId +
              deleteParam,
            method: 'POST',
          };
        },
        invalidatesTags: [TAG_TYPE_APPLICATION_DETAILS, TAG_TYPE_APPLICATIONS],
      }),
      approveVersion: build.mutation({
        query: ({ versionId }) => {
          return {
            url: apiSlicePathForModeration + '/approve_application/prompt_lib/' + versionId,
            method: 'POST',
          };
        },
        invalidatesTags: [TAG_TYPE_APPLICATION_DETAILS],
      }),
      rejectVersion: build.mutation({
        query: ({ versionId }) => {
          return {
            url: apiSlicePathForModeration + '/reject_application/prompt_lib/' + versionId,
            method: 'POST',
          };
        },
        invalidatesTags: [TAG_TYPE_APPLICATION_DETAILS],
      }),
      applicationExport: build.query({
        query: ({ projectId, id, fork, follow_version_ids, format = 'json' }) => {
          const params = new URLSearchParams();
          if (fork) params.append('fork', 'true');
          if (follow_version_ids?.length) params.append('follow_version_ids', follow_version_ids.join(','));
          if (format && format !== 'json') params.append('format', format);

          const queryString = params.toString();
          return {
            url: `${apiSlicePath}/export_import/prompt_lib/${projectId}/${id}${queryString ? '?' + queryString : ''}`,
            // For MD format, we need to handle blob response
            responseHandler: format === 'md' ? 'content-type' : 'json',
          };
        },
        providesTags: [],
      }),
      // Separate query for MD export that returns blob
      applicationExportMd: build.query({
        query: ({ projectId, id, follow_version_ids }) => {
          const params = new URLSearchParams();
          params.append('format', 'md');
          if (follow_version_ids?.length) params.append('follow_version_ids', follow_version_ids.join(','));

          return {
            url: `${apiSlicePath}/export_import/prompt_lib/${projectId}/${id}?${params.toString()}`,
            responseHandler: async response => {
              // Handle blob response for MD/ZIP files
              const contentType = response.headers.get('content-type') || '';
              const contentDisposition = response.headers.get('content-disposition') || '';

              // Extract filename from content-disposition header
              let filename = 'export.md';
              const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }

              const blob = await response.blob();
              return { blob, filename, contentType };
            },
          };
        },
        providesTags: [],
      }),
      uploadApplicationIcon: build.mutation({
        query: ({ projectId, versionId, files, width, height }) => {
          const form = new FormData();
          if (files?.length) {
            for (let i = 0; i < files.length; i++) {
              form.append('file', files[i]);
            }
            form.append('width', width);
            form.append('height', height);
          }
          return {
            url:
              apiSlicePath +
              (versionId
                ? `/upload_icon/prompt_lib/${projectId}/${versionId}`
                : `/upload_icon/prompt_lib/${projectId}`),
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_APPLICATION_ICONS];
        },
      }),
      replaceApplicationIcon: build.mutation({
        // eslint-disable-next-line no-unused-vars
        query: ({ projectId, versionId, entityId, ...body }) => {
          return {
            url: apiSlicePath + `/upload_icon/prompt_lib/${projectId}/${versionId}`,
            method: 'PUT',
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          // eslint-disable-next-line no-unused-vars
          const { projectId, versionId, entityId, ...icon_meta } = args;
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult = null;
          const foundApplicationDetailKey = cacheKeys.find(
            key => queries[key].endpointName === 'applicationDetails' && key.includes(entityId),
          );
          if (foundApplicationDetailKey) {
            const queryParams = foundApplicationDetailKey.replace('applicationDetails', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('applicationDetails', convertToJson(queryParams), draft => {
                draft.version_details.meta = {
                  ...(draft.version_details.meta || {}),
                  icon_meta,
                };
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult?.undo();
          }
        },
      }),
      deleteApplicationIcon: build.mutation({
        query: ({ projectId, name }) => {
          return {
            url: apiSlicePath + `/upload_icon/prompt_lib/${projectId}/${name}`,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const { projectId, name } = args;
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult = null;
          const foundKey = cacheKeys.find(
            key => queries[key].endpointName === 'getApplicationIcons' && key.includes(projectId),
          );
          if (foundKey) {
            const queryParams = foundKey.replace('getApplicationIcons', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('getApplicationIcons', convertToJson(queryParams), draft => {
                draft.rows = draft.rows.filter(icon => icon.name !== name);
                draft.total = draft.total - 1;
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult?.undo();
          }
        },
      }),
      getApplicationIcons: build.query({
        query: ({ projectId, page, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + `/upload_icon/prompt_lib/${projectId}`,
          params: {
            limit: pageSize,
            skip: page * pageSize,
          },
        }),
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([...currentCache.rows, ...newItems.rows]);
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
        providesTags: [TAG_TYPE_APPLICATION_ICONS],
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_APPLICATION_ICONS];
        },
      }),
      getApplicationDefaultIcons: build.query({
        query: ({ projectId }) => ({
          url: apiSlicePath + `/default_icons/prompt_lib/${projectId}`,
        }),
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_APPLICATION_DEFAULT_ICONS];
        },
      }),
      convertLegacyApplication: build.mutation({
        query: ({ ...body }) => {
          return {
            url: apiSlicePath + '/export_converter/prompt_lib',
            method: 'POST',
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
      }),
      // New API for agent/pipeline relation management
      updateApplicationRelation: build.mutation({
        query: ({ projectId, selectedApplicationId, selectedVersionId, ...body }) => {
          return {
            url: `${apiSlicePath}/application_relation/prompt_lib/${projectId}/${selectedApplicationId}/${selectedVersionId}`,
            method: 'PATCH',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { projectId, application_id, version_id }) => [
          // Invalidate validation cache to trigger immediate validation after adding agent/pipeline
          { type: 'ApplicationValidation', id: `${projectId}-${application_id}-${version_id}` },
        ],
      }),
      getRecommendations: build.query({
        query: ({ projectId, limit, days }) => ({
          url: `${apiSlicePath}/recommendations/prompt_lib/${projectId}`,
          params: {
            limit,
            days,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_PUBLIC_APPLICATIONS],
      }),
      validateApplicationVersion: build.query({
        query: ({ projectId, applicationId, versionId }) => ({
          url: `${apiSlicePath}/version_validator/prompt_lib/${projectId}/${applicationId}/${versionId}`,
        }),
        providesTags: (result, error, { projectId, applicationId, versionId }) => [
          { type: 'ApplicationValidation', id: `${projectId}-${applicationId}-${versionId}` },
        ],
        onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
          try {
            await queryFulfilled;
          } catch {
            // When validation fails, invalidate the version details cache
            // so stale data doesn't persist
            const { projectId, applicationId, versionId } = args;
            dispatch(
              eliteaApi.util.invalidateTags([
                { type: TAG_TYPE_APPLICATION_DETAILS, id: `${projectId}_${applicationId}_${versionId}` },
              ]),
            );
          }
        },
      }),
      setAgentAttachmentStorage: build.mutation({
        query: ({ projectId, applicationId, versionId, toolkit_id }) => {
          return {
            url:
              apiSlicePath +
              '/application_attachment_storage/prompt_lib/' +
              projectId +
              '/' +
              applicationId +
              '/' +
              versionId,
            method: 'PUT',
            body: { toolkit_id },
          };
        },
        invalidatesTags: [],
      }),
      getDocumentLoaders: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/index_types/prompt_lib/${projectId}`,
        }),
        providesTags: [TAG_TYPE_DOCUMENT_LOADERS],
      }),
      // Pipeline Trigger API endpoints
      getPipelineTrigger: build.query({
        query: ({ projectId, versionId }) => ({
          url: `${apiSlicePath}/pipeline_trigger/prompt_lib/${projectId}/pipeline/${versionId}/trigger`,
        }),
        providesTags: (result, error, { projectId, versionId }) => [
          { type: 'PipelineTrigger', id: `${projectId}-${versionId}` },
        ],
      }),
      updatePipelineTrigger: build.mutation({
        query: ({ projectId, versionId, ...body }) => ({
          url: `${apiSlicePath}/pipeline_trigger/prompt_lib/${projectId}/pipeline/${versionId}/trigger`,
          method: 'PUT',
          headers,
          body,
        }),
        invalidatesTags: (result, error, { projectId, versionId }) => {
          if (error) return [];
          return [{ type: 'PipelineTrigger', id: `${projectId}-${versionId}` }];
        },
      }),
    }),
  });

export const {
  useApplicationListQuery,
  useLazyApplicationListQuery,
  useTotalApplicationsQuery,
  useTotalMyLikedPublicApplicationsQuery,
  useTotalTrendingPublicApplicationsQuery,
  useTotalPublicApplicationsQuery,
  useApplicationCreateMutation,
  useApplicationEditMutation,
  useApplicationDetailsQuery,
  useApplicationSelectItemDetailsQuery,
  useLazyApplicationDetailsQuery,
  usePublicApplicationsListQuery,
  usePublicApplicationDetailsQuery,
  useLazyPublicApplicationDetailsQuery,
  useDeleteApplicationMutation,
  usePublishApplicationMutation,
  useUnpublishApplicationMutation,
  useValidateForPublishMutation,
  useLikeApplicationMutation,
  useUnlikeApplicationMutation,
  useDeleteApplicationToolMutation,
  useLazyGetApplicationVersionDetailQuery,
  useGetApplicationVersionDetailQuery,
  useSaveApplicationNewVersionMutation,
  useUpdateApplicationVersionMutation,
  useSetApplicationDefaultVersionMutation,
  useDeleteApplicationVersionMutation,
  useLazyCheckVersionInUseQuery,
  useBatchReplaceVersionReferencesMutation,
  useStopApplicationTaskMutation,
  useApproveVersionMutation,
  useRejectVersionMutation,
  useLazyApplicationExportQuery,
  useLazyApplicationExportMdQuery,
  useUploadApplicationIconMutation,
  useReplaceApplicationIconMutation,
  useDeleteApplicationIconMutation,
  useGetApplicationIconsQuery,
  useGetApplicationDefaultIconsQuery,
  useForkedFromApplicationDetailsQuery,
  useConvertLegacyApplicationMutation,
  useUpdateApplicationRelationMutation,
  useGetRecommendationsQuery,
  useValidateApplicationVersionQuery,
  useLazyValidateApplicationVersionQuery,
  useSetAgentAttachmentStorageMutation,
  useGetDocumentLoadersQuery,
  useLazyPublicApplicationsListQuery,
  useGetPipelineTriggerQuery,
  useLazyGetPipelineTriggerQuery,
  useUpdatePipelineTriggerMutation,
} = apiSlice;
