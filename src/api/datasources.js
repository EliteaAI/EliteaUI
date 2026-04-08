import { PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';
import { convertToJson, removeDuplicateObjects, stringToList } from '@/common/utils.jsx';

import { eliteaApi } from './eliteaApi.js';

export const TAG_TYPE_DATA_SOURCES = 'TAG_TYPE_DATA_SOURCES';
const TAG_TYPE_PUBLIC_DATA_SOURCES = 'TAG_TYPE_PUBLIC_DATA_SOURCES';
const TAG_TYPE_DATASOURCE_DETAILS = 'TAG_TYPE_DATASOURCE_DETAILS';
export const TAG_TYPE_TOTAL_DATASOURCES = 'TAG_TYPE_TOTAL_DATASOURCES';
const TAG_TYPE_TOTAL_PUBLIC_DATASOURCES = 'TAG_TYPE_TOTAL_PUBLIC_DATASOURCES';
const TAG_TYPE_DATASOURCES_ICONS = 'TAG_TYPE_DATASOURCES_ICONS';

const apiSlicePath = '/datasources';
const apiSlicePathForLike = '/elitea_core/like/prompt_lib/';
const headers = {
  'Content-Type': 'application/json',
};

export const apiSlice = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_DATASOURCE_DETAILS],
  })
  .injectEndpoints({
    endpoints: build => ({
      datasourceList: build.query({
        query: ({ projectId, page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/datasources/prompt_lib/' + projectId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_DATA_SOURCES],
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
      totalDataSources: build.query({
        query: ({ projectId, params }) => ({
          url: apiSlicePath + '/datasources/prompt_lib/' + projectId,
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_DATASOURCES],
      }),
      publicDataSourcesList: build.query({
        query: ({ page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/public_datasources/prompt_lib/',
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_PUBLIC_DATA_SOURCES],
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
      totalPublicDataSources: build.query({
        query: ({ params }) => ({
          url: apiSlicePath + '/public_datasources/prompt_lib',
          params: {
            ...params,
            limit: 1,
            offset: 0,
          },
        }),
        providesTags: [TAG_TYPE_TOTAL_PUBLIC_DATASOURCES],
      }),
      likeDataSource: build.mutation({
        query: datasourceId => {
          return {
            url: apiSlicePathForLike + PUBLIC_PROJECT_ID + '/datasource/' + datasourceId,
            method: 'POST',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_PUBLIC_DATASOURCES, TAG_TYPE_DATASOURCE_DETAILS],
      }),
      unlikeDataSource: build.mutation({
        query: datasourceId => {
          return {
            url: apiSlicePathForLike + PUBLIC_PROJECT_ID + '/datasource/' + datasourceId,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_PUBLIC_DATASOURCES, TAG_TYPE_DATASOURCE_DETAILS],
      }),
      datasourceCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/datasources/prompt_lib/' + projectId,
            method: 'POST',
            headers,
            body,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_DATASOURCE_DETAILS, { type: TAG_TYPE_DATASOURCE_DETAILS, id: result?.id }];
        },
        invalidatesTags: [TAG_TYPE_TOTAL_DATASOURCES, TAG_TYPE_DATA_SOURCES],
      }),
      datasourceEdit: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/datasource/prompt_lib/' + projectId + '/' + body.id,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_DATASOURCE_DETAILS, { type: TAG_TYPE_DATASOURCE_DETAILS, id: result?.id }];
        },
      }),
      deleteDatasource: build.mutation({
        query: ({ projectId, datasourceId }) => {
          return {
            url: apiSlicePath + '/datasource/prompt_lib/' + projectId + '/' + datasourceId,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_DATASOURCES, TAG_TYPE_DATA_SOURCES],
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult1 = null;
          let patchResult2 = null;
          const foundDatasourceListKey = cacheKeys.find(
            key => queries[key].endpointName === 'datasourceList',
          );
          if (foundDatasourceListKey) {
            const queryParams = foundDatasourceListKey.replace('datasourceList', '');
            patchResult1 = dispatch(
              eliteaApi.util.updateQueryData('datasourceList', convertToJson(queryParams), draft => {
                const index = draft.rows.findIndex(item => item.id === args.datasourceId);
                if (index !== -1) {
                  draft.rows.splice(index, 1);
                }
              }),
            );
          }
          const foundPublicDatasourceListKey = cacheKeys.find(
            key => queries[key].endpointName === 'publicDataSourcesList',
          );
          if (foundPublicDatasourceListKey) {
            const queryParams = foundPublicDatasourceListKey.replace('publicDataSourcesList', '');
            patchResult2 = dispatch(
              eliteaApi.util.updateQueryData('publicDataSourcesList', convertToJson(queryParams), draft => {
                const index = draft.rows.findIndex(item => item.id === args.datasourceId);
                if (index !== -1) {
                  draft.rows.splice(index, 1);
                }
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult1?.undo();
            patchResult2?.undo();
          }
        },
      }),
      publishDatasource: build.mutation({
        query: ({ projectId, datasourceVersionId }) => {
          return {
            url: apiSlicePath + '/publish/prompt_lib/' + projectId + '/' + datasourceVersionId,
            method: 'POST',
          };
        },
        invalidatesTags: (result, error, arg) => [{ type: TAG_TYPE_DATASOURCE_DETAILS, id: arg.id }],
      }),
      unpublishDatasource: build.mutation({
        query: ({ projectId, datasourceVersionId }) => {
          return {
            url: apiSlicePath + '/unpublish/prompt_lib/' + projectId + '/' + datasourceVersionId,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error, arg) => [{ type: TAG_TYPE_DATASOURCE_DETAILS, id: arg.id }],
      }),
      datasourceDetails: build.query({
        query: ({ projectId, datasourceId, versionName }) => {
          let url = apiSlicePath + '/datasource/prompt_lib/' + projectId + '/' + datasourceId;
          if (versionName) {
            url += '/' + versionName ? `/${versionName}` : '';
          }
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_DATASOURCE_DETAILS, { type: TAG_TYPE_DATASOURCE_DETAILS, id: result?.id }];
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
      publicDatasourceDetails: build.query({
        query: ({ datasourceId, versionName }) => {
          let url = apiSlicePath + '/public_datasource/prompt_lib/' + datasourceId;
          if (versionName) {
            url += '/' + versionName ? `/${versionName}` : '';
          }
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_DATASOURCE_DETAILS, { type: TAG_TYPE_DATASOURCE_DETAILS, id: result?.id }];
        },
      }),
      datasetCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          const form = new FormData();

          if (body?.source?.options?.file) {
            form.append('file', body.source.options.file);
            delete body.source.options.file;
          }

          if (body.source?.options?.extension_whitelist !== undefined) {
            body.source.options.extension_whitelist = stringToList(body.source?.options?.extension_whitelist);
          }
          if (body.source?.options?.extension_blacklist !== undefined) {
            body.source.options.extension_blacklist = stringToList(body.source?.options?.extension_blacklist);
          }

          form.append('data', JSON.stringify(body));

          return {
            url: apiSlicePath + '/datasets/prompt_lib/' + projectId + '?is_form=true',
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_DATASOURCE_DETAILS];
        },
      }),
      predict: build.mutation({
        query: ({ projectId, versionId, ...body }) => {
          return {
            url: apiSlicePath + '/predict/prompt_lib/' + projectId + '/' + versionId,
            method: 'POST',
            headers,
            body,
          };
        },
      }),
      stopDatasourceTask: build.mutation({
        query: ({ projectId, task_id }) => {
          return {
            url: apiSlicePath + '/task/prompt_lib/' + projectId + '/' + task_id,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
      }),
      datasetUpdate: build.mutation({
        query: ({ projectId, datasetId, ...body }) => {
          return {
            url: apiSlicePath + '/dataset/prompt_lib/' + projectId + '/' + datasetId,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_DATASOURCE_DETAILS],
      }),
      datasetDelete: build.mutation({
        // eslint-disable-next-line no-unused-vars
        query: ({ projectId, datasetId, datasourceId }) => {
          return {
            url: apiSlicePath + '/dataset/prompt_lib/' + projectId + '/' + datasetId,
            method: 'DELETE',
          };
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const { projectId, datasetId, datasourceId } = args;
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult = null;
          const foundKey = cacheKeys.find(
            key =>
              queries[key].endpointName === 'datasourceDetails' &&
              key.includes(projectId) &&
              key.includes(datasourceId + ''),
          );
          if (foundKey) {
            const queryParams = foundKey.replace('datasourceDetails', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('datasourceDetails', convertToJson(queryParams), draft => {
                draft.version_details.datasets = draft.version_details.datasets.filter(
                  dataset => dataset.id != datasetId,
                );
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult?.undo();
          }
        },
        invalidatesTags: [],
      }),
      datasetUploadFile: build.mutation({
        query: ({ projectId, datasetId, file }) => {
          const form = new FormData();
          if (file) {
            form.append('file', file);
          }
          return {
            url: apiSlicePath + '/dataset/prompt_lib/' + projectId + '/' + datasetId,
            body: form,
            formData: true,
            method: 'PATCH',
          };
        },
        invalidatesTags: [],
      }),
      datasetStopTask: build.mutation({
        query: ({ projectId, datasetId }) => {
          return {
            url: apiSlicePath + '/task/prompt_lib/' + projectId + '/' + datasetId,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_DATASOURCE_DETAILS];
        },
      }),
      search: build.mutation({
        query: ({ projectId, versionId, ...body }) => {
          return {
            url: apiSlicePath + '/search/prompt_lib/' + projectId + '/' + versionId,
            method: 'POST',
            headers,
            body,
          };
        },
      }),
      deduplicate: build.mutation({
        query: ({ projectId, versionId, ...body }) => {
          return {
            url: apiSlicePath + '/deduplicate/prompt_lib/' + projectId + '/' + versionId,
            method: 'POST',
            headers,
            body,
          };
        },
      }),
      datasourceExport: build.query({
        query: ({ projectId, id, fork }) => ({
          url:
            apiSlicePath +
            '/export_import/prompt_lib/' +
            projectId +
            '/' +
            id +
            '?key=as_file&value=1&disabled=true' +
            (fork ? '&fork=true' : ''),
        }),
        providesTags: [],
      }),
      uploadDatasourceIcon: build.mutation({
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
          return [TAG_TYPE_DATASOURCES_ICONS];
        },
      }),
      replaceDatasourceIcon: build.mutation({
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
          const foundDatasourceDetailKey = cacheKeys.find(
            key => queries[key].endpointName === 'datasourceDetails' && key.includes(entityId),
          );
          if (foundDatasourceDetailKey) {
            const queryParams = foundDatasourceDetailKey.replace('datasourceDetails', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('datasourceDetails', convertToJson(queryParams), draft => {
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
      deleteDatasourceIcon: build.mutation({
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
            key => queries[key].endpointName === 'getDatasourceIcons' && key.includes(projectId),
          );
          if (foundKey) {
            const queryParams = foundKey.replace('getDatasourceIcons', '');
            patchResult = dispatch(
              eliteaApi.util.updateQueryData('getDatasourceIcons', convertToJson(queryParams), draft => {
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
      getDatasourceIcons: build.query({
        query: ({ projectId, page, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + `/upload_icon/prompt_lib/${projectId}`,
          params: {
            skip: page * pageSize,
            limit: pageSize,
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
        providesTags: [TAG_TYPE_DATASOURCES_ICONS],
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_TYPE_DATASOURCES_ICONS];
        },
      }),
    }),
  });

export const {
  useDatasourceListQuery,
  useLazyDatasourceListQuery,
  useTotalDataSourcesQuery,
  useTotalPublicDataSourcesQuery,
  useDatasourceCreateMutation,
  useDatasourceEditMutation,
  useLazyDatasourceDetailsQuery,
  useDatasourceDetailsQuery,
  usePublicDataSourcesListQuery,
  usePublicDatasourceDetailsQuery,
  useLazyPublicDatasourceDetailsQuery,
  useDeleteDatasourceMutation,
  useDatasetCreateMutation,
  usePredictMutation,
  useDatasetUpdateMutation,
  useDatasetDeleteMutation,
  useDatasetStopTaskMutation,
  useSearchMutation,
  useDeduplicateMutation,
  usePublishDatasourceMutation,
  useUnpublishDatasourceMutation,
  useLikeDataSourceMutation,
  useUnlikeDataSourceMutation,
  useStopDatasourceTaskMutation,
  useLazyDatasourceExportQuery,
  useDatasetUploadFileMutation,
  useGetDatasourceIconsQuery,
  useUploadDatasourceIconMutation,
  useReplaceDatasourceIconMutation,
  useDeleteDatasourceIconMutation,
} = apiSlice;
