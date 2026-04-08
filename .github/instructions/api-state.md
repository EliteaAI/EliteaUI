# API Integration and State Management Instructions

## API Architecture Overview

EliteA UI uses **RTK Query** for all API operations, built on Redux Toolkit. All API endpoints extend from a
centralized `eliteaApi` configuration.

> **Note**: This document provides extended API and state management examples. For standard API integration
> patterns, refer to the main `copilot-instructions.md` file, which includes:
>
> - RTK Query structure and endpoint creation
> - API pattern conventions
> - Tag-based cache invalidation
> - Environment variable usage with `getEnvVar`

## API Structure Pattern

### Base API Configuration (`/api/eliteaApi.js`)

```javascript
// ✅ Base API setup
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const eliteaApi = createApi({
  reducerPath: 'eliteaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: VITE_SERVER_URL,
    prepareHeaders: headers => {
      if (DEV) {
        VITE_DEV_TOKEN && headers.set('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
        headers.set('Cache-Control', 'no-cache');
      }
      return headers;
    },
  }),
  tagTypes: ['Applications', 'DataSources', 'Pipelines', 'Toolkits'],
  endpoints: () => ({}),
});
```

### Feature API Modules

Each domain has its own API file extending `eliteaApi`:

```javascript
// ✅ Feature API pattern (/api/applications.js)
import { eliteaApi } from './eliteaApi';

export const applicationsApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    // Query endpoints
    getApplications: builder.query({
      query: ({ projectId, page = 1, pageSize = 20, ...params }) => ({
        url: `/api/v2/projects/${projectId}/applications`,
        params: { page, page_size: pageSize, ...params },
      }),
      providesTags: (result, error, { projectId }) => [
        { type: 'Applications', id: 'LIST' },
        { type: 'Applications', id: projectId },
      ],
    }),

    getApplicationDetail: builder.query({
      query: ({ projectId, applicationId }) => `/api/v2/projects/${projectId}/applications/${applicationId}`,
      providesTags: (result, error, { applicationId }) => [{ type: 'Applications', id: applicationId }],
    }),

    // Mutation endpoints
    createApplication: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/api/v2/projects/${projectId}/applications`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Applications', id: 'LIST' },
        { type: 'Applications', id: projectId },
      ],
    }),

    updateApplication: builder.mutation({
      query: ({ projectId, applicationId, ...data }) => ({
        url: `/api/v2/projects/${projectId}/applications/${applicationId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { applicationId, projectId }) => [
        { type: 'Applications', id: applicationId },
        { type: 'Applications', id: projectId },
      ],
    }),

    // Lazy query for conditional loading
    getApplicationMetrics: builder.query({
      query: ({ applicationId, timeRange = '7d' }) =>
        `/api/v2/applications/${applicationId}/metrics?range=${timeRange}`,
      providesTags: ['Metrics'],
    }),
  }),
});

// ✅ Export hooks
export const {
  useGetApplicationsQuery,
  useLazyGetApplicationsQuery,
  useGetApplicationDetailQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useLazyGetApplicationMetricsQuery,
} = applicationsApi;
```

## Query Hook Usage Patterns

### Standard Query Usage

```javascript
// ✅ Basic query usage
const MyComponent = () => {
  const { data, error, isLoading, refetch } = useGetApplicationsQuery({
    projectId: selectedProjectId,
    page: 1,
    pageSize: 20,
  });

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ApplicationsList
      data={data}
      onRefresh={refetch}
    />
  );
};
```

### Conditional/Lazy Queries

```javascript
// ✅ Lazy query for user-triggered actions
const ApplicationDetails = ({ applicationId }) => {
  const [getMetrics, { data: metrics, isLoading: metricsLoading }] = useLazyGetApplicationMetricsQuery();

  const handleLoadMetrics = useCallback(() => {
    getMetrics({ applicationId, timeRange: '30d' });
  }, [getMetrics, applicationId]);

  return (
    <div>
      <Button onClick={handleLoadMetrics}>Load Metrics</Button>
      {metricsLoading && <LoadingIndicator />}
      {metrics && <MetricsChart data={metrics} />}
    </div>
  );
};
```

### Skip Queries Conditionally

```javascript
// ✅ Skip queries when data not available
const ConditionalData = ({ userId }) => {
  const { data, isLoading } = useGetUserDataQuery(
    { userId },
    { skip: !userId }, // Skip if userId is not available
  );

  if (!userId) return <div>Please select a user</div>;
  if (isLoading) return <LoadingIndicator />;

  return <UserProfile data={data} />;
};
```

## Mutation Patterns

### Standard Mutations with Toast Feedback

```javascript
// ✅ Mutation with proper error handling
import { useToast } from '@/components/useToast';

const CreateApplicationForm = () => {
  const [createApplication, { isLoading }] = useCreateApplicationMutation();
  const { toastSuccess, toastError } = useToast();

  const handleSubmit = useCallback(
    async values => {
      try {
        const result = await createApplication({
          projectId: selectedProjectId,
          ...values,
        }).unwrap();

        toastSuccess('Application created successfully');
        // Navigate or update UI
        navigate(`/applications/${result.id}`);
      } catch (error) {
        toastError(error?.data?.message || 'Failed to create application');
      }
    },
    [createApplication, selectedProjectId, toastSuccess, toastError, navigate],
  );

  return <Formik onSubmit={handleSubmit}>{/* Form implementation */}</Formik>;
};
```

### Optimistic Updates

```javascript
// ✅ Optimistic updates for better UX
const LikeButton = ({ itemId, isLiked }) => {
  const [updateLike] = useUpdateLikeMutation();
  const { toastError } = useToast();

  const handleToggleLike = useCallback(async () => {
    // Optimistic update
    const originalValue = isLiked;

    try {
      await updateLike({
        itemId,
        liked: !isLiked,
      }).unwrap();
    } catch (error) {
      // Revert on error
      toastError('Failed to update like status');
    }
  }, [updateLike, itemId, isLiked]);

  return <Button onClick={handleToggleLike}>{isLiked ? '❤️' : '🤍'}</Button>;
};
```

## Cache Management

### Tag-Based Invalidation

```javascript
// ✅ Proper cache invalidation strategy
export const applicationsApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    getApplications: builder.query({
      query: ({ projectId }) => `/api/v2/projects/${projectId}/applications`,
      providesTags: (result, error, { projectId }) => [
        { type: 'Applications', id: 'LIST' },
        ...(result?.items || []).map(({ id }) => ({ type: 'Applications', id })),
      ],
    }),

    updateApplication: builder.mutation({
      query: ({ projectId, applicationId, ...data }) => ({
        url: `/api/v2/projects/${projectId}/applications/${applicationId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Applications', id: applicationId },
        { type: 'Applications', id: 'LIST' }, // Refresh list as well
      ],
    }),
  }),
});
```

### Manual Cache Updates

```javascript
// ✅ Selective cache updates for performance
const useOptimizedDataUpdate = () => {
  const dispatch = useDispatch();

  const updateCacheData = useCallback(
    (applicationId, updates) => {
      dispatch(
        applicationsApi.util.updateQueryData('getApplications', { projectId }, draft => {
          const application = draft.items.find(item => item.id === applicationId);
          if (application) {
            Object.assign(application, updates);
          }
        }),
      );
    },
    [dispatch, projectId],
  );

  return updateCacheData;
};
```

## Redux State Management

### Slice Structure Pattern

```javascript
// ✅ Standard slice pattern (/slices/featureName.js)
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // UI state only (API data managed by RTK Query)
  selectedTab: 'all',
  filters: {
    status: 'all',
    category: null,
  },
  viewMode: 'grid', // 'grid' | 'list'
  isRightPanelOpen: false,
};

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },

    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    toggleRightPanel: state => {
      state.isRightPanelOpen = !state.isRightPanelOpen;
    },

    resetFilters: state => {
      state.filters = initialState.filters;
    },
  },
});

export const { name, actions } = featureSlice;
export default featureSlice.reducer;
```

### Store Configuration

Store is already configured in `/src/store.js`. When adding new slices:

```javascript
// ✅ Add new slice to store
import NewFeatureReducer, { name as newFeatureReducerName } from './slices/newFeature';

const Store = configureStore({
  reducer: {
    [eliteaReducerPath]: eliteaReducer,
    // ... existing reducers
    [newFeatureReducerName]: NewFeatureReducer,
  },
  // ... middleware configuration
});
```

## Custom Hooks for API Integration

### Page-Level Data Hooks

```javascript
// ✅ Custom hook combining multiple data sources
export const useApplicationsPageData = projectId => {
  const [searchParams] = useSearchParams();

  const queryParams = useMemo(
    () => ({
      projectId,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
    }),
    [projectId, searchParams],
  );

  const {
    data: applications,
    error: applicationsError,
    isLoading: applicationsLoading,
    refetch: refetchApplications,
  } = useGetApplicationsQuery(queryParams);

  const { data: categories, isLoading: categoriesLoading } = useGetApplicationCategoriesQuery({ projectId });

  return {
    applications: applications?.items || [],
    totalCount: applications?.total || 0,
    categories: categories || [],
    isLoading: applicationsLoading || categoriesLoading,
    error: applicationsError,
    refetch: refetchApplications,
    queryParams,
  };
};
```

### Search and Filter Hooks

```javascript
// ✅ Debounced search hook
import { useDebounceValue } from '@/components/useDebounceValue';

export const useSearchApplications = projectId => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounceValue(searchTerm, 300);

  const { data, isLoading, error } = useGetApplicationsQuery(
    {
      projectId,
      search: debouncedSearch,
    },
    {
      skip: !debouncedSearch, // Skip if no search term
    },
  );

  return {
    searchTerm,
    setSearchTerm,
    results: data?.items || [],
    isSearching: isLoading,
    error,
  };
};
```

## Error Handling Patterns

### Global Error Handling

```javascript
// ✅ API error handling utility
export const handleApiError = (error, showError) => {
  const message = error?.data?.message || error?.data?.detail || 'An unexpected error occurred';

  const status = error?.status;

  switch (status) {
    case 401:
      // Handle authentication error
      showError('Session expired. Please log in again.');
      // Redirect to login
      break;
    case 403:
      showError('You do not have permission to perform this action.');
      break;
    case 404:
      showError('The requested resource was not found.');
      break;
    case 422:
      // Handle validation errors
      if (error.data?.errors) {
        const validationMessages = Object.values(error.data.errors).flat();
        showError(validationMessages.join(', '));
      } else {
        showError(message);
      }
      break;
    default:
      showError(message);
  }
};
```

### Component-Level Error Boundaries

```javascript
// ✅ Feature-specific error boundary
import { ErrorBoundary } from 'react-error-boundary';

const ApplicationsErrorFallback = ({ error, resetErrorBoundary }) => (
  <Box
    p={3}
    textAlign="center"
  >
    <Typography
      variant="h6"
      color="error"
      gutterBottom
    >
      Failed to load applications
    </Typography>
    <Typography
      variant="body2"
      color="textSecondary"
      paragraph
    >
      {error.message}
    </Typography>
    <Button
      onClick={resetErrorBoundary}
      variant="contained"
    >
      Try Again
    </Button>
  </Box>
);

const ApplicationsPage = () => (
  <ErrorBoundary
    FallbackComponent={ApplicationsErrorFallback}
    onReset={() => window.location.reload()}
  >
    <ApplicationsList />
  </ErrorBoundary>
);
```

## WebSocket Integration

### Socket Hook Pattern

```javascript
// ✅ WebSocket integration with RTK Query
import { useSocket } from '@/hooks/useSocket';

export const useRealtimeApplications = projectId => {
  const dispatch = useDispatch();

  // Listen for real-time updates
  useSocket(
    'application_updated',
    useCallback(
      data => {
        // Update RTK Query cache
        dispatch(
          applicationsApi.util.updateQueryData('getApplications', { projectId }, draft => {
            const index = draft.items.findIndex(item => item.id === data.id);
            if (index !== -1) {
              draft.items[index] = { ...draft.items[index], ...data };
            }
          }),
        );
      },
      [dispatch, projectId],
    ),
  );

  // Listen for new applications
  useSocket(
    'application_created',
    useCallback(
      newApplication => {
        dispatch(applicationsApi.util.invalidateTags([{ type: 'Applications', id: 'LIST' }]));
      },
      [dispatch],
    ),
  );
};
```

## Performance Optimization

### Query Optimization

```javascript
// ✅ Selective field queries
const getLightweightApplications = builder.query({
  query: ({ projectId }) => ({
    url: `/api/v2/projects/${projectId}/applications`,
    params: {
      fields: 'id,name,status,updated_at', // Only fetch needed fields
    },
  }),
});

// ✅ Pagination with cursor
const getApplicationsWithCursor = builder.query({
  query: ({ projectId, cursor, limit = 20 }) => ({
    url: `/api/v2/projects/${projectId}/applications`,
    params: { cursor, limit },
  }),
  // Merge pages for infinite scroll
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    const { cursor, ...rest } = queryArgs;
    return endpointName + JSON.stringify(rest);
  },
  merge: (currentCache, newItems) => {
    if (currentCache) {
      currentCache.items.push(...newItems.items);
      currentCache.next_cursor = newItems.next_cursor;
    } else {
      return newItems;
    }
  },
  forceRefetch({ currentArg, previousArg }) {
    return currentArg?.cursor !== previousArg?.cursor;
  },
});
```

Remember: Always use RTK Query for API operations. The centralized caching and invalidation system is crucial
for maintaining data consistency across the application.
