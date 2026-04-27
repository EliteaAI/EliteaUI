import { PAGE_SIZE } from '@/common/constants.js';
import { convertToJson, removeDuplicateObjects } from '@/common/utils.jsx';

import { alitaApi } from './alitaApi.js';

const apiSlicePath = '/configurations';

// Helper function to append query parameters (supports both single values and arrays)
const appendParam = (queryParams, key, value) => {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach(v => queryParams.append(key, v));
  } else {
    queryParams.append(key, value);
  }
};

// Cache tags for RTK Query caching and invalidation
export const TAG_CONFIGURATIONS = 'TAG_CONFIGURATIONS';
export const TAG_CONFIGURATION_DETAILS = 'TAG_CONFIGURATION_DETAILS';
export const TAG_AVAILABLE_CONFIGURATIONS = 'TAG_AVAILABLE_CONFIGURATIONS';
export const TAG_SHARED_CONFIGURATIONS = 'TAG_SHARED_CONFIGURATIONS';
export const TAG_MODELS = 'TAG_MODELS';

const headers = {
  'Content-Type': 'application/json',
};

export const configurationsApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: ['configurations'],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Get available configuration types
      getAvailableConfigurationsType: build.query({
        query: ({ section, ...params } = {}) => {
          // Handle array of sections to create multiple section parameters
          const queryParams = new URLSearchParams();

          // Add other params first
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value);
            }
          });

          // Handle section parameter - support both single and multiple sections
          if (section) {
            if (Array.isArray(section)) {
              // Add multiple section parameters: ?section=llm&section=embedding&section=vectorstorage&section=ai_credentials
              section.forEach(s => queryParams.append('section', s));
            } else {
              // Single section parameter
              queryParams.append('section', section);
            }
          }

          return {
            url: `${apiSlicePath}/available/?${queryParams.toString()}`,
          };
        },
        providesTags: [TAG_AVAILABLE_CONFIGURATIONS],
      }),

      // Get a list of existing configurations
      getConfigurationsList: build.query({
        query: ({
          projectId,
          page = 0,
          type = null,
          section = null,
          pageSize = PAGE_SIZE,
          includeShared = false,
          sharedOffset = 0,
          sharedLimit = PAGE_SIZE,
          // eslint-disable-next-line no-unused-vars
          isTableView: _isTableView,
          params: extraParams = {
            sort_by: 'created_at',
            sort_order: 'desc',
            query: '',
          },
        }) => {
          const { sort_by, sort_order, query } = extraParams || {};
          // Check if we need URLSearchParams for array parameters
          const hasArrayParams = Array.isArray(section) || Array.isArray(type);

          if (hasArrayParams) {
            // For array params, use URLSearchParams to create multiple query parameters
            const queryParams = new URLSearchParams();

            // Add standard parameters
            queryParams.append('include_shared', includeShared);
            queryParams.append('shared_offset', sharedOffset);
            queryParams.append('shared_limit', sharedLimit);
            queryParams.append('limit', pageSize);
            queryParams.append('offset', page * pageSize);
            queryParams.append('sort_by', sort_by);
            queryParams.append('sort_order', sort_order);
            queryParams.append('query', query);

            // Handle type and section using helper function
            appendParam(queryParams, 'type', type);
            appendParam(queryParams, 'section', section);

            return {
              url: `/configurations/configurations/${projectId}?${queryParams.toString()}`,
            };
          } else {
            // Original implementation for single section or no section
            const params = {
              include_shared: includeShared,
              shared_offset: sharedOffset,
              shared_limit: sharedLimit,
              limit: pageSize,
              offset: page * pageSize,
              sort_by,
              sort_order,
              query,
            };
            if (type) {
              params.type = type;
            }
            if (section) {
              params.section = section;
            }
            return {
              url: `/configurations/configurations/${projectId}`, // configurations/configurations/{{project_id}}?include_shared=true&shared_offset=0&shared_limit=20
              params,
            };
          }
        },
        providesTags: [TAG_CONFIGURATIONS, TAG_SHARED_CONFIGURATIONS],
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: !args.isTableView && args.page > 0,
          };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          const { isTableView, ...otherArgs } = queryArgs;
          Object.keys(otherArgs)
            .filter(prop => isTableView || prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.items = removeDuplicateObjects([...currentCache.items, ...(newItems.items || [])]);
            currentCache.limit = newItems.limit;
            currentCache.offset = newItems.offset;
            currentCache.shared.items = removeDuplicateObjects([
              ...currentCache.shared.items,
              ...(newItems.shared?.items || []),
            ]);
            currentCache.shared.limit = newItems.shared?.limit;
            currentCache.shared.offset = newItems.shared?.offset;
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.items = newItems.items || [];
            currentCache.total = newItems.total;
            currentCache.limit = newItems.limit;
            currentCache.offset = newItems.offset;
            currentCache.shared = {
              items: newItems.shared?.items || [],
              total: newItems.shared?.total || 0,
              limit: newItems.shared?.limit || PAGE_SIZE,
              offset: newItems.shared?.offset || 0,
            };
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),

      // Get configurations filtered by type
      getConfigurationsByType: build.query({
        query: ({ projectId, type, page = 0, pageSize = PAGE_SIZE, params = {} }) => {
          const queryParams = {
            type,
            limit: pageSize,
            offset: page * pageSize,
            ...params,
          };
          return {
            url: `/configurations/configurations/${projectId}`,
            params: queryParams,
          };
        },
        providesTags: [TAG_CONFIGURATIONS, TAG_SHARED_CONFIGURATIONS],
      }),

      // Get configurations filtered by section
      getConfigurationsBySection: build.query({
        query: ({ projectId, section, page = 0, pageSize = PAGE_SIZE, params = {} }) => {
          // Handle section parameter to support both single and multiple sections
          if (section && Array.isArray(section)) {
            // For array sections, use URLSearchParams to create multiple section parameters
            const queryParams = new URLSearchParams();

            // Add standard parameters
            queryParams.append('limit', pageSize);
            queryParams.append('offset', page * pageSize);

            // Add any additional params
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                queryParams.append(key, value);
              }
            });

            // Add multiple section parameters: ?section=llm&section=embedding&section=vectorstorage&section=ai_credentials
            section.forEach(s => queryParams.append('section', s));

            return {
              url: `/configurations/configurations/${projectId}?${queryParams.toString()}`,
            };
          } else {
            // Original implementation for single section
            const queryParams = {
              section,
              limit: pageSize,
              offset: page * pageSize,
              ...params,
            };
            return {
              url: `/configurations/configurations/${projectId}`,
              params: queryParams,
            };
          }
        },
        providesTags: [TAG_CONFIGURATIONS, TAG_SHARED_CONFIGURATIONS],
      }),

      // Create new configuration
      createConfiguration: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/configurations/configurations/${projectId}`,
          method: 'POST',
          headers,
          body,
        }),
        invalidatesTags: (result, error, arg) => {
          // Only invalidate tags if the mutation was successful (no error)
          if (error) {
            return [];
          }
          const tags = [TAG_CONFIGURATIONS, TAG_SHARED_CONFIGURATIONS, TAG_AVAILABLE_CONFIGURATIONS];
          const { body: { type } = {} } = arg || {};
          if (type === 'llm_model') {
            tags.push(TAG_MODELS);
          }
          return tags;
        },
      }),

      // Get specific configuration details
      getConfigurationDetail: build.query({
        query: ({ projectId, configId }) => ({
          url: `/configurations/configuration/${projectId}/${configId}`,
        }),
        providesTags: (result, error, { configId }) => [{ type: TAG_CONFIGURATION_DETAILS, id: configId }],
      }),

      // Get shared configurations only
      getSharedConfigurations: build.query({
        query: ({ projectId, page = 0, params = {}, pageSize = PAGE_SIZE }) => ({
          url: `/configurations/configurations/${projectId}`,
          params: {
            ...params,
            include_shared: true,
            shared_offset: page * pageSize,
            shared_limit: pageSize,
          },
        }),
        providesTags: [TAG_SHARED_CONFIGURATIONS],
        transformResponse: response => {
          // Extract shared configurations from response
          return response.shared || { total: 0, items: [], offset: 0, limit: PAGE_SIZE };
        },
      }),

      // Update existing configuration
      updateConfiguration: build.mutation({
        query: ({ projectId, configId, body }) => ({
          method: 'PUT',
          url: `/configurations/configuration/${projectId}/${configId}`,
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        }),
        invalidatesTags: (result, error, { configId, body } = {}) => {
          // Only invalidate tags if the mutation was successful (no error)
          if (error) {
            return [];
          }

          const tags = [
            TAG_CONFIGURATIONS,
            TAG_SHARED_CONFIGURATIONS,
            { type: TAG_CONFIGURATION_DETAILS, id: configId },
          ];

          const data = body?.data;
          if (
            data &&
            (Object.prototype.hasOwnProperty.call(data, 'low_tier') ||
              Object.prototype.hasOwnProperty.call(data, 'high_tier') ||
              Object.prototype.hasOwnProperty.call(data, 'mid_tier') ||
              Object.prototype.hasOwnProperty.call(data, 'max_output_tokens') ||
              Object.prototype.hasOwnProperty.call(data, 'context_window') ||
              Object.prototype.hasOwnProperty.call(data, 'supports_reasoning') ||
              Object.prototype.hasOwnProperty.call(data, 'name'))
          ) {
            tags.push(TAG_MODELS);
          }

          return tags;
        },
      }),

      // Delete configuration
      deleteConfiguration: build.mutation({
        query: ({ projectId, configId }) => ({
          method: 'DELETE',
          url: `/configurations/configuration/${projectId}/${configId}`,
        }),
        invalidatesTags: (result, error, { configId }) => {
          // Only invalidate tags if the mutation was successful (no error)
          if (error) {
            return [];
          }

          return [
            TAG_CONFIGURATIONS,
            TAG_SHARED_CONFIGURATIONS,
            { type: TAG_CONFIGURATION_DETAILS, id: configId },
          ];
        },
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const {
            alitaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult1 = null;
          const foundListKey = cacheKeys.find(
            key =>
              queries[key].endpointName === 'getConfigurationsList' &&
              queries[key].originalArgs?.section === args.section,
          );
          if (foundListKey) {
            const queryParams = foundListKey.replace('getConfigurationsList', '');
            patchResult1 = dispatch(
              alitaApi.util.updateQueryData('getConfigurationsList', convertToJson(queryParams), draft => {
                const index = draft.items.findIndex(item => item.id === args.configId);
                if (index !== -1) {
                  draft.items.splice(index, 1);
                }
              }),
            );
          }
          try {
            await queryFulfilled;
          } catch {
            patchResult1?.undo();
          }
        },
      }),

      // Test configuration connection
      testConfigurationConnection: build.mutation({
        query: ({ projectId, configType, body }) => ({
          method: 'POST',
          url: `/configurations/check_connection/${projectId}/${configType}`,
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        }),
      }),

      // Toggle configuration sharing status
      toggleConfigurationSharing: build.mutation({
        query: ({ projectId, configId, shared }) => ({
          method: 'PUT',
          url: `/configurations/configuration/${projectId}/${configId}`,
          headers: {
            'Content-Type': 'application/json',
          },
          body: { shared },
        }),
        invalidatesTags: (result, error, { configId }) => {
          // Only invalidate tags if the mutation was successful (no error)
          if (error) {
            return [];
          }

          return [
            TAG_CONFIGURATIONS,
            TAG_SHARED_CONFIGURATIONS,
            { type: TAG_CONFIGURATION_DETAILS, id: configId },
          ];
        },
      }),

      // List models for a configuration
      listModels: build.query({
        query: ({ projectId, include_shared = false, section }) => ({
          url: `/configurations/models/${projectId}`,
          params: { include_shared, section },
        }),
        transformResponse: response => {
          response.items = (response.items || []).map(i => ({ ...i, id: `${i.project_id}_${i.name}` }));
          return response;
        },
        providesTags: [TAG_MODELS],
      }),
      // list credential types
      listCredentialTypes: build.query({
        query: ({ projectId }) => ({
          url: `/configurations/types/${projectId}`,
        }),
      }),
      setProjectDefaultModel: build.mutation({
        query: ({ projectId, name, target_project_id, section = 'llm' }) => ({
          url: `/configurations/models/${projectId}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: { name, target_project_id, section },
        }),
        transformResponse: response => {
          response.items = (response.items || []).map(i => ({ ...i, id: `${i.project_id}_${i.name}` }));
          return response;
        },
        invalidatesTags: [TAG_MODELS],
      }),
    }),
  });

// Export hooks for components to use
export const {
  // Queries
  useGetAvailableConfigurationsTypeQuery,
  useLazyGetAvailableConfigurationsTypeQuery,
  useGetConfigurationsListQuery,
  useLazyGetConfigurationsListQuery,

  useGetConfigurationsByTypeQuery,
  useLazyGetConfigurationsByTypeQuery,
  useGetConfigurationsBySectionQuery,
  useLazyGetConfigurationsBySectionQuery,
  useGetSharedConfigurationsQuery,
  useLazyGetSharedConfigurationsQuery,
  useGetConfigurationDetailQuery,
  useLazyGetConfigurationDetailQuery,
  useListModelsQuery,
  useLazyListModelsQuery,

  // Mutations
  useCreateConfigurationMutation,
  useUpdateConfigurationMutation,
  useDeleteConfigurationMutation,
  useTestConfigurationConnectionMutation,
  useToggleConfigurationSharingMutation,
  useListCredentialTypesQuery,
  useSetProjectDefaultModelMutation,
} = configurationsApi;
