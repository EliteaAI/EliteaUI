import { alitaApi } from './alitaApi.js';

const TAG_TYPE_ANALYTICS = 'ANALYTICS';
const CACHE_LIFETIME = 300; // 5 minutes

export const analyticsApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_ANALYTICS],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectAnalytics: build.query({
        query: ({ projectId, dateFrom, dateTo }) => {
          const params = new URLSearchParams();
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          const qs = params.toString();
          return {
            url: `/elitea_core/analytics/prompt_lib/${projectId}${qs ? `?${qs}` : ''}`,
            method: 'GET',
          };
        },
        providesTags: [TAG_TYPE_ANALYTICS],
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      analyticsUsers: build.query({
        query: ({
          projectId,
          dateFrom,
          dateTo,
          limit = 20,
          offset = 0,
          search = '',
          sortBy = 'total_events',
          sortOrder = 'desc',
        }) => {
          const params = new URLSearchParams();
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          params.set('limit', String(limit));
          params.set('offset', String(offset));
          if (search) params.set('search', search);
          params.set('sort_by', sortBy);
          params.set('sort_order', sortOrder);
          return {
            url: `/elitea_core/analytics_users/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      analyticsUserDetail: build.query({
        query: ({ projectId, userId, dateFrom, dateTo }) => {
          const params = new URLSearchParams();
          params.set('user_id', String(userId));
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          return {
            url: `/elitea_core/analytics_user_detail/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      analyticsTools: build.query({
        query: ({
          projectId,
          dateFrom,
          dateTo,
          limit = 20,
          offset = 0,
          search = '',
          sortBy = 'calls',
          sortOrder = 'desc',
        }) => {
          const params = new URLSearchParams();
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          params.set('limit', String(limit));
          params.set('offset', String(offset));
          if (search) params.set('search', search);
          params.set('sort_by', sortBy);
          params.set('sort_order', sortOrder);
          return {
            url: `/elitea_core/analytics_tools/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      analyticsToolDetail: build.query({
        query: ({ projectId, toolName, dateFrom, dateTo }) => {
          const params = new URLSearchParams();
          params.set('tool_name', toolName);
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          return {
            url: `/elitea_core/analytics_tool_detail/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      analyticsAgents: build.query({
        query: ({
          projectId,
          dateFrom,
          dateTo,
          limit = 20,
          offset = 0,
          search = '',
          sortBy = 'events',
          sortOrder = 'desc',
        }) => {
          const params = new URLSearchParams();
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          params.set('limit', String(limit));
          params.set('offset', String(offset));
          if (search) params.set('search', search);
          params.set('sort_by', sortBy);
          params.set('sort_order', sortOrder);
          return {
            url: `/elitea_core/analytics_agents/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      analyticsAgentDetail: build.query({
        query: ({ projectId, entityId, dateFrom, dateTo }) => {
          const params = new URLSearchParams();
          params.set('entity_id', String(entityId));
          if (dateFrom) params.set('date_from', dateFrom);
          if (dateTo) params.set('date_to', dateTo);
          return {
            url: `/elitea_core/analytics_agent_detail/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
    }),
  });

export const {
  useProjectAnalyticsQuery,
  useLazyProjectAnalyticsQuery,
  useAnalyticsUsersQuery,
  useAnalyticsUserDetailQuery,
  useAnalyticsToolsQuery,
  useAnalyticsToolDetailQuery,
  useAnalyticsAgentsQuery,
  useAnalyticsAgentDetailQuery,
} = analyticsApi;
