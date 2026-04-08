import { memo, useCallback, useMemo, useState } from 'react';

import { Box, IconButton, Skeleton } from '@mui/material';

import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import CloseIcon from '@/components/Icons/CloseIcon';
import useDebounceValue from '@/hooks/useDebounceValue';

import BucketFooter from './BucketFooter';
import BucketHeader from './BucketHeader';
import BucketStorageSelector from './BucketStorageSelector';
import BucketsListContent, { BUCKET_TYPES } from './BucketsListContent';

const BucketsPanel = memo(props => {
  const {
    // Data
    buckets,
    selectedBucket,
    selectedFile,
    currentPrefix,
    configurationTitle,
    storageConfigurations,
    currentStorageUsage,
    isLoadingBuckets,
    isError,
    collapsed,
    // Callbacks
    onSelectBucket,
    onCollapsed,
    onCreateBucket,
    onStorageChange,
    onUpload,
    onSelectFile,
    onSelectFolder,
    onEdit,
    onDelete,
  } = props;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const styles = bucketsPanelStyles(collapsed);

  // Debounce search query
  const debouncedSearchQuery = useDebounceValue(searchQuery, 300);

  // Map storage configurations to options format
  const storageOptions = useMemo(
    () =>
      storageConfigurations?.map(item => ({
        value: item.title || item.elitea_title || item.name,
        label: item.name || item.title || item.elitea_title,
        ...item,
      })) || [],
    [storageConfigurations],
  );

  // Filter buckets based on search query
  const filteredBuckets = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return buckets;
    }

    const filterQuery = debouncedSearchQuery.toLowerCase().trim();
    return buckets.filter(bucket => bucket.name?.toLowerCase().includes(filterQuery));
  }, [buckets, debouncedSearchQuery]);

  // Determine bucket list type for rendering
  const bucketsType = useMemo(() => {
    if (filteredBuckets.length > 0) return BUCKET_TYPES.DATA;
    if (searchQuery && !filteredBuckets.length && buckets.length > 0) return BUCKET_TYPES.FILTERED_EMPTY;
    if (!isLoadingBuckets && buckets.length === 0 && !isError) return BUCKET_TYPES.EMPTY;
    return null;
  }, [isLoadingBuckets, filteredBuckets.length, searchQuery, buckets.length, isError]);

  const handleSearchChange = useCallback(newQuery => {
    setSearchQuery(newQuery);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearchActive(false);
  }, []);

  const handleSearchActivate = useCallback(isActive => {
    setIsSearchActive(isActive);
  }, []);

  const handleSelect = useCallback(
    bucket => {
      onSelectBucket(bucket);
    },
    [onSelectBucket],
  );

  return (
    <Box sx={styles.root}>
      <BucketHeader
        collapsed={collapsed}
        onCreateBucket={onCreateBucket}
        onCollapsed={onCollapsed}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onSearchActivate={handleSearchActivate}
      />

      {!collapsed && (
        <BucketStorageSelector
          storageOptions={storageOptions}
          configurationTitle={configurationTitle}
          onStorageChange={onStorageChange}
        />
      )}

      {isSearchActive && !collapsed && (
        <Box sx={styles.searchBarContainer}>
          <SimpleSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSearchClear={handleSearchClear}
            placeholder="Search buckets..."
          />
          <IconButton
            onClick={handleSearchClear}
            variant="elitea"
            color="tertiary"
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
        </Box>
      )}

      <Box sx={styles.bucketListOuterContainer}>
        {isLoadingBuckets &&
          Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              animation="wave"
              variant="rectangular"
              sx={styles.bucketSkeleton}
            />
          ))}

        {!isLoadingBuckets && (
          <Box sx={styles.bucketListInnerContainer}>
            <BucketsListContent
              bucketsType={bucketsType}
              filteredBuckets={filteredBuckets}
              selectedBucketName={selectedBucket?.name}
              selectedFile={selectedFile}
              currentPrefix={currentPrefix}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={handleSelect}
              onUpload={onUpload}
              onSelectFile={onSelectFile}
              onSelectFolder={onSelectFolder}
            />
          </Box>
        )}
      </Box>

      {!collapsed && (
        <BucketFooter
          bucketCount={buckets?.length || 0}
          totalSize={currentStorageUsage?.totalSize || '0B'}
        />
      )}
    </Box>
  );
});

BucketsPanel.displayName = 'BucketsPanel';

/** @type {MuiSx} */
const bucketsPanelStyles = collapsed => ({
  root: ({ palette }) => ({
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: collapsed ? 'center' : 'stretch',
    background: palette.background.eliteaDefault,
  }),
  searchBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 0.8rem',
    paddingBottom: '0',
  },
  closeIcon: {
    fontSize: '1.25rem',
  },
  bucketListOuterContainer: {
    display: collapsed ? 'none' : 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'auto',
    gap: '0.5rem',
    padding: '1rem',
  },
  bucketSkeleton: {
    width: '100%',
    height: '2.5rem',
    borderRadius: '0.5rem',
  },
  bucketListInnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '0',
    maxWidth: '100%',
  },
});

export default BucketsPanel;
