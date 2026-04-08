# Performance and Best Practices

## Performance Optimization Guidelines

EliteA UI is a complex React application with real-time features, data visualization, and AI chat
capabilities. Follow these performance best practices to maintain optimal user experience.

> **Note**: This document provides extended performance optimization examples. For standard performance
> patterns, refer to the main `copilot-instructions.md` file, which includes:
>
> - Component memoization with `React.memo()`
> - Proper use of `useMemo` and `useCallback`
> - Component displayName for debugging
> - Consistent prop destructuring patterns
>
> The FSD migration has improved performance through:
>
> - Better tree-shaking with named exports
> - Reduced bundle size through explicit imports
> - Improved code splitting with clear module boundaries

## React Performance Patterns

### Component Memoization Strategy

```javascript
// ✅ Strategic use of React.memo
import React, { memo, useCallback, useMemo } from 'react';

// Heavy computational component
const DataVisualization = memo(
  ({ data, onDataChange }) => {
    const processedData = useMemo(() => {
      // Expensive data processing
      return data.map(item => ({
        ...item,
        computed: performHeavyCalculation(item),
      }));
    }, [data]);

    const handleDataChange = useCallback(
      newData => {
        onDataChange(newData);
      },
      [onDataChange],
    );

    return (
      <Chart
        data={processedData}
        onChange={handleDataChange}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for complex props
    return (
      prevProps.data.length === nextProps.data.length &&
      prevProps.data.every(
        (item, index) =>
          item.id === nextProps.data[index]?.id && item.updatedAt === nextProps.data[index]?.updatedAt,
      )
    );
  },
);

// ✅ Memoize expensive selectors
const useExpensiveSelector = projectId => {
  return useSelector(useCallback(state => computeExpensiveValue(state.applications, projectId), [projectId]));
};
```

### Lazy Loading and Code Splitting

```javascript
// ✅ Route-level code splitting
import { Suspense, lazy } from 'react';

import LoadingIndicator from '@/components/LoadingIndicator';

const ApplicationsPage = lazy(() => import('@/pages/Applications/Applications'));
const PipelinesPage = lazy(() => import('@/pages/Pipelines/Pipelines'));

const AppRouter = () => (
  <Routes>
    <Route
      path="/applications/*"
      element={
        <Suspense fallback={<LoadingIndicator />}>
          <ApplicationsPage />
        </Suspense>
      }
    />
    <Route
      path="/pipelines/*"
      element={
        <Suspense fallback={<LoadingIndicator />}>
          <PipelinesPage />
        </Suspense>
      }
    />
  </Routes>
);

// ✅ Component-level lazy loading
const HeavyModal = lazy(() => import('./HeavyModal'));

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Open Modal</Button>
      {showModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyModal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </>
  );
};
```

### Virtual Scrolling for Large Lists

```javascript
// ✅ Virtualized list for performance
import { FixedSizeList as List } from 'react-window';

const VirtualizedApplicationList = ({ applications }) => {
  const Row = useCallback(
    ({ index, style }) => {
      const application = applications[index];
      return (
        <div style={style}>
          <ApplicationCard application={application} />
        </div>
      );
    },
    [applications],
  );

  return (
    <List
      height={600}
      itemCount={applications.length}
      itemSize={120}
      overscanCount={5}
    >
      {Row}
    </List>
  );
};

// ✅ Infinite scroll with RTK Query
const useInfiniteApplications = projectId => {
  const [page, setPage] = useState(1);
  const [allApplications, setAllApplications] = useState([]);

  const { data, isFetching } = useGetApplicationsQuery({
    projectId,
    page,
    pageSize: 50,
  });

  useEffect(() => {
    if (data?.items) {
      setAllApplications(prev => (page === 1 ? data.items : [...prev, ...data.items]));
    }
  }, [data, page]);

  const hasMore = data?.hasMore || false;
  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isFetching]);

  return { applications: allApplications, loadMore, hasMore, isFetching };
};
```

## State Management Optimization

### RTK Query Performance

```javascript
// ✅ Selective data fetching
const getApplicationsLight = builder.query({
  query: ({ projectId }) => ({
    url: `/api/v2/projects/${projectId}/applications`,
    params: {
      fields: 'id,name,status,updated_at', // Only needed fields
      limit: 50,
    },
  }),
  providesTags: ['ApplicationsList'],
});

// ✅ Cache optimization with transformResponse
const getApplicationsWithTransform = builder.query({
  query: ({ projectId }) => `/api/v2/projects/${projectId}/applications`,
  transformResponse: response => {
    // Transform data once, cache the result
    return {
      ...response,
      items: response.items.map(item => ({
        ...item,
        displayName: formatDisplayName(item),
        statusColor: getStatusColor(item.status),
      })),
    };
  },
});

// ✅ Polling with smart intervals
const useRealtimeApplications = (projectId, isActive) => {
  return useGetApplicationsQuery(
    { projectId },
    {
      pollingInterval: isActive ? 30000 : 0, // Poll only when active
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );
};
```

### Debounced Search and Filters

```javascript
// ✅ Optimized search implementation
import { useDebounceValue } from '@/components/useDebounceValue';

const useOptimizedSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounceValue(searchTerm, 300);

  // Skip API call for short search terms
  const shouldSearch = debouncedSearch.length >= 3;

  const { data, isFetching } = useSearchApplicationsQuery(
    { search: debouncedSearch },
    { skip: !shouldSearch },
  );

  return {
    searchTerm,
    setSearchTerm,
    results: data?.items || [],
    isSearching: isFetching && shouldSearch,
    hasSearched: shouldSearch,
  };
};

// ✅ Efficient filter management
const useSmartFilters = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    category: null,
    dateRange: null,
  });

  // Memoize active filters to prevent unnecessary re-renders
  const activeFilters = useMemo(() => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== 'all') {
        acc[key] = value;
      }
      return acc;
    }, {});
  }, [filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return { filters, activeFilters, updateFilter };
};
```

## UI Performance Optimization

### Efficient Rendering Patterns

```javascript
// ✅ Avoid inline objects and functions
const MyComponent = ({ items, onItemClick }) => {
  // ❌ Bad - creates new objects on every render
  // return items.map(item => (
  //   <Item key={item.id} style={{ margin: 10 }} onClick={() => onItemClick(item)} />
  // ));

  // ✅ Good - stable references
  const itemStyle = useMemo(() => ({ margin: 10 }), []);

  const handleItemClick = useCallback(
    item => {
      onItemClick(item);
    },
    [onItemClick],
  );

  return items.map(item => (
    <Item
      key={item.id}
      style={itemStyle}
      onClick={() => handleItemClick(item)}
    />
  ));
};

// ✅ Optimize list rendering
const OptimizedList = ({ items, renderItem }) => {
  // Use stable keys for better reconciliation
  const getItemKey = useCallback(item => `${item.id}-${item.version}`, []);

  return (
    <Box>
      {items.map(item => (
        <Box key={getItemKey(item)}>{renderItem(item)}</Box>
      ))}
    </Box>
  );
};
```

### Image and Asset Optimization

```javascript
// ✅ Lazy image loading
import { useEffect, useRef, useState } from 'react';

const LazyImage = ({ src, alt, placeholder, ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();

  useEffect(() => {
    let observer;

    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1 },
      );
      observer.observe(imageRef);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      {...props}
    />
  );
};

// ✅ SVG icon optimization
const IconCache = new Map();

const CachedIcon = ({ iconName, ...props }) => {
  const [IconComponent, setIconComponent] = useState(null);

  useEffect(() => {
    if (IconCache.has(iconName)) {
      setIconComponent(IconCache.get(iconName));
    } else {
      import(`@/assets/${iconName}.svg`).then(module => {
        const Component = module.ReactComponent;
        IconCache.set(iconName, Component);
        setIconComponent(Component);
      });
    }
  }, [iconName]);

  if (!IconComponent) return null;
  return <IconComponent {...props} />;
};
```

## Memory Management

### Cleanup Patterns

```javascript
// ✅ Proper cleanup in useEffect
const useWebSocketConnection = url => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = error => console.error('WebSocket error:', error);

    setSocket(ws);

    // ✅ Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url]);

  return { socket, isConnected };
};

// ✅ Cancel async operations
const useCancellableAsync = () => {
  const cancelRef = useRef();

  const execute = useCallback(async asyncFn => {
    // Cancel previous operation
    if (cancelRef.current) {
      cancelRef.current();
    }

    let cancelled = false;
    cancelRef.current = () => {
      cancelled = true;
    };

    try {
      const result = await asyncFn();
      if (!cancelled) {
        return result;
      }
    } catch (error) {
      if (!cancelled) {
        throw error;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, []);

  return execute;
};
```

### Event Listener Management

```javascript
// ✅ Efficient event listeners
const useKeyboardShortcuts = shortcuts => {
  useEffect(() => {
    const handleKeyDown = event => {
      // Create key combination string
      const combo = [
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const action = shortcuts[combo];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Usage
const MyComponent = () => {
  const shortcuts = useMemo(
    () => ({
      'ctrl+s': () => handleSave(),
      'ctrl+n': () => handleNew(),
      escape: () => handleClose(),
    }),
    [],
  );

  useKeyboardShortcuts(shortcuts);

  return <div>Component content</div>;
};
```

## Bundle Optimization

### Import Optimization

```javascript
// ✅ Tree-shaking friendly imports
// Instead of importing all of lodash
import { format } from 'date-fns/format';
// ❌ Avoid default imports from large libraries
// import * as MUI from '@mui/material';
// import * as Icons from '@mui/icons-material';

// ✅ Specific utility imports
import { debounce } from 'lodash/debounce';

import { Add, Delete, Edit } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

// Instead of all date-fns
```

### Dynamic Imports for Heavy Dependencies

```javascript
// ✅ Lazy load heavy libraries
const useChartLibrary = () => {
  const [chartLib, setChartLib] = useState(null);

  const loadChart = useCallback(async () => {
    if (!chartLib) {
      const { default: Chart } = await import('chart.js');
      setChartLib(Chart);
    }
    return chartLib;
  }, [chartLib]);

  return { chartLib, loadChart };
};

// ✅ Conditional loading based on feature flags
const useConditionalFeature = () => {
  const [feature, setFeature] = useState(null);

  useEffect(() => {
    if (FEATURE_FLAGS.ADVANCED_ANALYTICS) {
      import('./AdvancedAnalytics').then(module => {
        setFeature(module.default);
      });
    }
  }, []);

  return feature;
};
```

## Monitoring and Profiling

### Performance Monitoring

```javascript
// ✅ Performance monitoring hook
const usePerformanceMonitor = componentName => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        // Warn for slow renders
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
      }

      // Send to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'performance', {
          component: componentName,
          render_time: renderTime,
        });
      }
    };
  });
};

// ✅ Memory usage monitoring
const useMemoryMonitor = () => {
  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
        const usage = (usedJSHeapSize / totalJSHeapSize) * 100;

        if (usage > 90) {
          console.warn('High memory usage detected:', usage + '%');
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);
};
```

### Error Boundaries for Performance

```javascript
// ✅ Performance-aware error boundary
import { ErrorBoundary } from 'react-error-boundary';

const PerformanceErrorBoundary = ({ children, componentName }) => {
  const handleError = (error, errorInfo) => {
    // Log performance-related errors
    console.error(`Performance error in ${componentName}:`, error);

    // Send to error tracking
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        component: componentName,
      });
    }
  };

  return (
    <ErrorBoundary
      onError={handleError}
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <Box
          p={2}
          textAlign="center"
        >
          <Typography color="error">Component failed to load efficiently</Typography>
          <Button onClick={resetErrorBoundary}>Reload Component</Button>
        </Box>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## Best Practices Checklist

### Code Quality

- [ ] Remove all `console.log` statements before committing
- [ ] Use `useCallback` for event handlers passed as props
- [ ] Use `useMemo` for expensive calculations
- [ ] Implement proper error boundaries
- [ ] Add loading states for all async operations
- [ ] Use debouncing for search and input fields
- [ ] Implement proper cleanup in `useEffect`

### Performance

- [ ] Lazy load heavy components and routes
- [ ] Use virtual scrolling for large lists (>100 items)
- [ ] Implement proper caching strategies
- [ ] Optimize images and assets
- [ ] Use code splitting for better bundle sizes
- [ ] Monitor and profile component render times
- [ ] Implement proper memoization strategies

### Accessibility

- [ ] Add proper ARIA labels and roles
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Maintain proper color contrast ratios
- [ ] Implement focus management
- [ ] Add loading announcements for screen readers

### Security

- [ ] Sanitize user inputs
- [ ] Validate all API responses
- [ ] Use proper authentication checks
- [ ] Implement proper error handling
- [ ] Avoid exposing sensitive data in logs
- [ ] Use HTTPS for all API calls

Remember: Performance optimization should be data-driven. Use React DevTools Profiler and browser performance
tools to identify actual bottlenecks before optimizing.
