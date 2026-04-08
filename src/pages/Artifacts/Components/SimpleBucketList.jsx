import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { sortBucketsByRecent } from '@/common/bucketSortingUtils';

import BucketContent from './BucketContent';
import BucketItem from './BucketItem';

const SimpleBucketList = memo(props => {
  const {
    buckets,
    selectedBucketName,
    selectedFile,
    currentPrefix,
    onEdit,
    onDelete,
    onSelect,
    onUpload,
    onSelectFile,
    onSelectFolder,
  } = props;

  const [hoveredBucketName, setHoveredBucketName] = useState(null);
  const [expandedBuckets, setExpandedBuckets] = useState({});
  const selectedBucketRef = useRef(null);
  const hasInitialScrolledRef = useRef(false);

  const styles = simpleBucketListStyles();

  const handleItemHover = useCallback((bucketName, isHovered) => {
    setHoveredBucketName(isHovered ? bucketName : null);
  }, []);

  const handleBucketToggle = useCallback(bucketName => {
    setExpandedBuckets(prev => ({
      ...prev,
      [bucketName]: !prev[bucketName],
    }));
  }, []);

  // Auto-expand selected bucket to show files (only when selection changes)
  useEffect(() => {
    if (selectedBucketName && !expandedBuckets[selectedBucketName]) {
      setExpandedBuckets(prev => ({
        ...prev,
        [selectedBucketName]: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBucketName]); // Only re-run when selectedBucketName changes, not expandedBuckets

  // Scroll to top only on initial load from URL
  useEffect(() => {
    if (
      !hasInitialScrolledRef.current &&
      selectedBucketName &&
      selectedBucketRef.current &&
      buckets.length > 0
    ) {
      hasInitialScrolledRef.current = true;

      selectedBucketRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBucketName]);

  const sortedBuckets = useMemo(() => {
    return sortBucketsByRecent(buckets);
  }, [buckets]);

  return (
    <>
      {sortedBuckets.length > 0 ? (
        <Box>
          {sortedBuckets.map((bucket, index) => {
            const nextBucket = sortedBuckets[index + 1];
            const isNextBucketHighlighted =
              nextBucket?.name === hoveredBucketName ||
              (nextBucket?.name === selectedBucketName && !selectedFile && !currentPrefix);
            const isExpanded = expandedBuckets[bucket.name];
            const isSelected = bucket.name === selectedBucketName;

            return (
              <Box key={bucket.name}>
                <BucketItem
                  ref={isSelected ? selectedBucketRef : null}
                  bucket={bucket}
                  isActive={bucket.name === selectedBucketName && !selectedFile && !currentPrefix}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  onUpload={onUpload}
                  isNextItemHighlighted={isNextBucketHighlighted}
                  onItemHover={handleItemHover}
                  isExpanded={isExpanded}
                  onToggle={handleBucketToggle}
                />
                {isExpanded && (
                  <BucketContent
                    bucket={bucket}
                    selectedFile={selectedFile}
                    currentPrefix={currentPrefix}
                    selectedBucketName={selectedBucketName}
                    onSelectFile={onSelectFile}
                    onSelectFolder={onSelectFolder}
                    isNextBucketHighlighted={isNextBucketHighlighted}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      ) : (
        <Typography
          variant="bodyMedium"
          color="text.button.disabled"
          sx={styles.emptyState}
        >
          No buckets found.
        </Typography>
      )}
    </>
  );
});

SimpleBucketList.displayName = 'SimpleBucketList';

/** @type {MuiSx} */
const simpleBucketListStyles = () => ({
  emptyState: {
    textAlign: 'center',
  },
});

export default SimpleBucketList;
