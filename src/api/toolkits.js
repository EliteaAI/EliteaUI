import { convertToJson, removeDuplicateObjects } from '@/common/utils.jsx';

// Import TAG_TYPE_APPLICATION_DETAILS from applications.js to invalidate application cache when toolkit is associated
import { TAG_TYPE_APPLICATION_DETAILS } from './applications.js';
import { eliteaApi } from './eliteaApi.js';

export const TAG_TYPE_TOOLKITS = 'TAG_TYPE_TOOLKITS';
export const TAG_TYPE_TOOLKIT_DETAILS = 'TOOLKIT_DETAILS';
export const TAG_TYPE_TOOLKIT_TYPES = 'TOOLKIT_TYPES';
export const TAG_TYPE_TOTAL_TOOLKITS = 'TOTAL_TOOLKITS';
export const TAG_TYPE_DETAILS_TOOLKITS = 'DETAILS_TOOLKITS';
export const TAG_TYPE_TOOLKIT_AVAILABLE_TOOLS = 'TOOLKIT_AVAILABLE_TOOLS';

const headers = {
  'Content-Type': 'application/json',
};

const apiSlicePath = '/elitea_core';

export const toolkitsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [
      TAG_TYPE_TOOLKIT_DETAILS,
      TAG_TYPE_TOOLKIT_TYPES,
      TAG_TYPE_TOTAL_TOOLKITS,
      TAG_TYPE_DETAILS_TOOLKITS,
      TAG_TYPE_TOOLKIT_AVAILABLE_TOOLS,
    ],
  })
  .injectEndpoints({
    endpoints: build => ({
      toolkitTypes: build.query({
        query: ({ projectId, params }) => ({
          url: apiSlicePath + '/toolkits/prompt_lib/' + projectId,
          params,
        }),
        // providesTags: [TAG_TYPE_TOOLKIT_TYPES],
        keepUnusedDataFor: 60 * 2, // 2 min
        providesTags: (result, error, { projectId }) =>
          result ? [{ type: TAG_TYPE_TOOLKIT_TYPES, id: projectId }] : [],
      }),

      toolkitsList: build.query({
        query: ({ projectId, page, page_size, params }) => {
          // eslint-disable-next-line no-unused-vars
          const { toolkit_type, isTableView: _isTableView, ...otherParams } = params || {};

          // Handle multiple toolkit_type values
          const queryParams = new URLSearchParams();

          // Add other parameters first
          Object.entries(otherParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value);
            }
          });

          // Add pagination parameters
          queryParams.append('limit', page_size);
          queryParams.append('offset', page * page_size);

          // Handle toolkit_type as array or single value
          if (toolkit_type) {
            if (Array.isArray(toolkit_type)) {
              // Multiple toolkit types: toolkit_type=type1&toolkit_type=type2
              toolkit_type.forEach(type => {
                queryParams.append('toolkit_type', type);
              });
            } else {
              // Single toolkit type
              queryParams.append('toolkit_type', toolkit_type);
            }
          }

          return {
            url: `${apiSlicePath}/tools/prompt_lib/${projectId}?${queryParams.toString()}`,
          };
        },
        providesTags: [TAG_TYPE_TOTAL_TOOLKITS],
        transformResponse: (response, meta, args) => {
          const { isTableView } = args;
          return Array.isArray(response)
            ? {
                rows: response,
                total: meta?.response?.headers?.get('x-total-count') || response.length,
                isLoadMore: !isTableView && args.page > 0,
              }
            : {
                ...response,
                isLoadMore: !isTableView && args.page > 0,
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

      toolkitsDetails: build.query({
        query: ({ projectId, toolkitId, params }) => ({
          url: apiSlicePath + '/tool/prompt_lib/' + projectId + '/' + toolkitId,
          params: {
            ...params,
          },
        }),
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
        // Use dynamic tags with the specific toolkit ID
        providesTags: (result, error, { toolkitId }) => [
          TAG_TYPE_DETAILS_TOOLKITS,
          { type: TAG_TYPE_DETAILS_TOOLKITS, id: toolkitId },
        ],
      }),

      toolkitCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/tools/prompt_lib/' + projectId,
            method: 'POST',
            headers,
            body,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_DETAILS_TOOLKITS, { type: TAG_TYPE_DETAILS_TOOLKITS, id: result?.id }];
        },
        invalidatesTags: [TAG_TYPE_TOTAL_TOOLKITS, TAG_TYPE_TOOLKITS],
      }),

      toolkitEdit: build.mutation({
        query: ({ projectId, toolId, ...body }) => {
          return {
            url: apiSlicePath + '/tool/prompt_lib/' + projectId + '/' + toolId,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { toolId, ignoreInvalidateApplicationDetails }) =>
          !ignoreInvalidateApplicationDetails
            ? [
                TAG_TYPE_APPLICATION_DETAILS,
                TAG_TYPE_TOTAL_TOOLKITS,
                TAG_TYPE_TOOLKITS,
                { type: TAG_TYPE_DETAILS_TOOLKITS, id: toolId },
                { type: TAG_TYPE_TOOLKIT_AVAILABLE_TOOLS, id: toolId },
              ]
            : [
                TAG_TYPE_TOTAL_TOOLKITS,
                TAG_TYPE_TOOLKITS,
                { type: TAG_TYPE_DETAILS_TOOLKITS, id: toolId },
                { type: TAG_TYPE_TOOLKIT_AVAILABLE_TOOLS, id: toolId },
              ],
      }),

      toolkitDelete: build.mutation({
        query: ({ projectId, toolkitId }) => {
          return {
            url: apiSlicePath + '/tool/prompt_lib/' + projectId + '/' + toolkitId,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_TOOLKITS, TAG_TYPE_TOOLKITS, TAG_TYPE_TOOLKIT_DETAILS],
        onQueryStarted: async (args, { dispatch, getState, queryFulfilled }) => {
          const {
            eliteaApi: { queries },
          } = getState();
          const cacheKeys = Object.keys(queries || {});
          let patchResult1 = null;
          const foundToolkitsListKey = cacheKeys.find(key => queries[key].endpointName === 'toolkitsList');
          if (foundToolkitsListKey) {
            const queryParams = foundToolkitsListKey.replace('toolkitsList', '');
            patchResult1 = dispatch(
              eliteaApi.util.updateQueryData('toolkitsList', convertToJson(queryParams), draft => {
                const index = draft.rows.findIndex(item => item.id === args.toolkitId);
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
          }
        },
      }),

      toolkitFork: build.mutation({
        query: ({ projectId, data }) => {
          //@todo: temporary solution to be ready to show fork functionality
          // Check if `data` is an array or a single object
          const formattedData = Array.isArray(data)
            ? data.map(item => ({
                ...item, // Spread the existing object properties
                entity: 'toolkits', // Add or override `entity` key for all items
                // owner_id: 46, // Add `owner_id` dynamically (adjust if needed)
                owner_id: projectId, // Add `owner_id` dynamically (adjust if needed)
              }))
            : [
                {
                  ...data, // Spread the properties of the single object
                  entity: 'toolkits',
                  // owner_id: 46,
                  owner_id: projectId,
                },
              ];

          return {
            url: `${apiSlicePath}/fork_toolkit/prompt_lib/${projectId}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              toolkits: formattedData, // Add the formatted toolkits
            },
          };
        },
        // query: ({ projectId, id, fork, data }) => ({
        //   url: apiSlicePath + '/fork_toolkit/prompt_lib/' + projectId ,
        //   method: 'POST',
        //   headers,
        //   body: {
        //     toolkits: [
        //       {
        //         ...data, // Spread existing keys and values
        //         entity: "toolkits", // Add a new key-value pair
        //         "owner_id": 46, //@todo: need to check with BE how and where to get this parameter
        //       }
        //     ]
        //   }
        //   // //ToDo: example valid working body - can be removed after testing
        //   // body: {
        //   //   "toolkits": [
        //   //     {
        //   //       "id": 1,
        //   //       "entity": "toolkits",
        //   //       "owner_id": 55,
        //   //       "author_id": 55,
        //   //       "import_uuid": "a1000000-0000-0000-0000-000000000000",
        //   //       "name": "Pytest: old way agent",
        //   //       "original_exported": false,
        //   //       "description": "Some old way application, referenced by id/version_id",
        //   //       "type": "artifact",
        //   //       "settings": {
        //   //         "variables": [],
        //   //         "application_id": 778,
        //   //         "application_version_id": 1006
        //   //       },
        //   //       "meta": {"parent_author_id": 3, "parent_entity_id": 670, "parent_project_id": 2}
        //   //     }
        //   //   ]
        //   // }
        // }),
        //@todo: temporary solution to return result for prepareData in ImportWizard during the forking
        transformResponse: response => response.result || {}, // Extract the `result` key
        providesTags: [],
      }),

      toolkitExport: build.query({
        query: ({ projectId, id, fork }) => ({
          url:
            apiSlicePath + '/export_toolkit/prompt_lib/' + projectId + '/' + id + (fork ? '?fork=true' : ''),
        }),
        providesTags: [],
      }),

      toolkitTest: build.mutation({
        query: ({ projectId, id, ...body }) => {
          return {
            url: apiSlicePath + '/test_tool/prompt_lib/' + projectId + '/' + id + '?await_response=true',
            method: 'POST',
            headers,
            body,
          };
        },
      }),
      mcpSyncTools: build.mutation({
        query: ({
          projectId,
          url,
          headers: reqHeaders,
          timeout,
          mcp_tokens,
          sid,
          ssl_verify,
          toolkit_type, // For pre-built MCPs, backend will resolve server URL from toolkit_type
          awaitResponse = true,
        }) => {
          return {
            url:
              apiSlicePath + '/mcp_sync_tools/prompt_lib/' + projectId + '?await_response=' + awaitResponse,
            method: 'POST',
            headers,
            body: {
              url,
              headers: reqHeaders,
              timeout,
              mcp_tokens,
              sid,
              ssl_verify,
              toolkit_type,
            },
          };
        },
      }),

      // Discover tools from pre-configured MCP servers (e.g., mcp_github_copilot)
      // This replaces using configurations/check_connection for MCP tool discovery
      discoverMcpTools: build.mutation({
        query: ({ projectId, toolkitType, settings }) => {
          return {
            url: `${apiSlicePath}/toolkit_discover_tools/prompt_lib/${projectId}/${toolkitType}`,
            method: 'POST',
            headers,
            body: settings,
          };
        },
      }),

      // Commented out - replaced with socket implementation using test_toolkit_tool event
      // toolkitToolTest: build.mutation({
      //   query: ({ projectId, toolkit_config, tool_name, tool_params, llm_model, llm_settings, llm, api_token, ...additionalParams }) => {
      //     // Ensure tool_params is always an object, not an array
      //     const safeToolParams = (tool_params && typeof tool_params === 'object' && !Array.isArray(tool_params))
      //       ? tool_params
      //       : {};
      //
      //     return ({
      //       url: apiSlicePath + '/test_toolkit_tool/prompt_lib/' + projectId + '?await_response=true',
      //       method: 'POST',
      //       headers,
      //       body: {
      //         toolkit_config,
      //         tool_name,
      //         tool_params: safeToolParams,
      //         llm_model: llm_model,
      //         llm_settings: llm_settings || {
      //           max_tokens: 1024,
      //           temperature: 0.1,
      //           top_p: 1.0
      //         },
      //         ...additionalParams
      //       },
      //     });
      //   }
      // }),

      toolkitAssociate: build.mutation({
        query: ({
          projectId,
          toolkitId,
          entity_version_id,
          entity_id,
          entity_type = 'agent',
          has_relation = true,
          selected_tools, // Add selected_tools parameter
        }) => {
          return {
            url: apiSlicePath + '/tool/prompt_lib/' + projectId + '/' + toolkitId,
            method: 'PATCH',
            headers,
            body: {
              entity_version_id,
              entity_id,
              entity_type,
              has_relation,
              selected_tools,
            },
          };
        },
        // Invalidate application version detail cache when toolkit is added or removed
        invalidatesTags: (result, error, args) => {
          const { projectId, entity_id, entity_version_id } = args || {};
          const tags = [TAG_TYPE_TOTAL_TOOLKITS, TAG_TYPE_TOOLKITS];
          if (projectId && entity_id && entity_version_id) {
            tags.push({
              type: TAG_TYPE_APPLICATION_DETAILS,
              id: `${projectId}_${entity_id}_${entity_version_id}`,
            });
          }
          return tags;
        },
        async onQueryStarted(args, { dispatch, queryFulfilled }) {
          // Optimistic update for toolkit add/remove
          const {
            projectId,
            entity_id,
            entity_version_id,
            toolkitId,
            has_relation,
            toolkitName,
            toolkitType,
            toolkitDescription,
            toolkitSettings,
          } = args;
          let patchResult;
          if (projectId && entity_id && entity_version_id) {
            const type = toolkitType || args.type;
            patchResult = dispatch(
              eliteaApi.util.updateQueryData(
                'getApplicationVersionDetail',
                { projectId, applicationId: entity_id, versionId: entity_version_id },
                draft => {
                  if (has_relation === false) {
                    // Remove toolkit
                    draft.tools = (draft.tools || []).filter(tool => tool.id !== toolkitId);
                  } else {
                    // Add toolkit (avoid duplicates)
                    if (!draft.tools) draft.tools = [];
                    if (!draft.tools.some(tool => tool.id === toolkitId)) {
                      draft.tools.push({
                        id: toolkitId,
                        type,
                        name: toolkitName,
                        description: toolkitDescription,
                        settings: toolkitSettings,
                      });
                    }
                  }
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
      validateToolkit: build.query({
        query: ({ projectId, toolkitId, mcpTokens = {} }) => ({
          url: `${apiSlicePath}/toolkit_validator/prompt_lib/${projectId}/${toolkitId}`,
          headers: {
            'X-Toolkit-Tokens': JSON.stringify(mcpTokens),
          },
        }),
        providesTags: (result, error, { toolkitId }) => [{ type: TAG_TYPE_DETAILS_TOOLKITS, id: toolkitId }],
      }),

      toolkitAvailableTools: build.query({
        query: ({ projectId, toolkitId }) => ({
          url: `${apiSlicePath}/toolkit_available_tools/prompt_lib/${projectId}/${toolkitId}`,
        }),
        providesTags: (result, error, { toolkitId }) => [
          { type: TAG_TYPE_TOOLKIT_AVAILABLE_TOOLS, id: toolkitId },
        ],
        keepUnusedDataFor: 60 * 5,
      }),
      listToolkitTypes: build.query({
        query: ({ projectId, params }) => ({
          url: `${apiSlicePath}/toolkit_types/prompt_lib/${projectId}`,
          params,
        }),
        providesTags: [],
      }),
    }),
  });

export const {
  useToolkitTypesQuery,
  useLazyToolkitTypesQuery,
  useToolkitsListQuery,
  useLazyToolkitsListQuery,
  useToolkitTestMutation,
  // useToolkitToolTestMutation, // Replaced with socket implementation (test_toolkit_tool event)
  useMcpSyncToolsMutation,
  useDiscoverMcpToolsMutation,
  useToolkitsDetailsQuery,
  useLazyToolkitsDetailsQuery,
  useToolkitCreateMutation,
  useToolkitEditMutation,
  useToolkitDeleteMutation,
  useToolkitForkMutation,
  useToolkitAssociateMutation,
  useLazyToolkitExportQuery,
  useValidateToolkitQuery,
  useToolkitAvailableToolsQuery,
  useLazyToolkitAvailableToolsQuery,
  useListToolkitTypesQuery,
} = toolkitsApi;
