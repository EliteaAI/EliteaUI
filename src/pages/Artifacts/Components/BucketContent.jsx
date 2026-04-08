import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useArtifactListQuery } from '@/api/artifacts';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import FileTreeItem from './FileTreeItem';
import { buildFileTree } from './utils/buildFileTree';
import { getExpandedPathsFromFileKey } from './utils/getExpandedPathsFromFileKey';

const BucketContent = memo(props => {
  const {
    bucket,
    selectedFile,
    currentPrefix,
    selectedBucketName,
    onSelectFile,
    onSelectFolder,
    isNextBucketHighlighted = false,
  } = props;

  const projectId = useSelectedProjectId();
  const styles = bucketContentStyles();

  // Calculate which folders should be expanded based on selected file path or current prefix
  const expandedPaths = useMemo(() => {
    if (selectedBucketName !== bucket?.name) {
      return [];
    }

    const pathToExpand = selectedFile?.key || currentPrefix;
    return pathToExpand ? getExpandedPathsFromFileKey(pathToExpand) : [];
  }, [selectedFile?.key, currentPrefix, selectedBucketName, bucket?.name]);

  const {
    data: bucketData,
    isLoading,
    isError,
  } = useArtifactListQuery(
    {
      projectId,
      bucket: bucket.name,
    },
    {
      skip: !projectId || !bucket?.name,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );

  const contentItems = useMemo(() => bucketData?.contents || [], [bucketData]);
  const fileTree = useMemo(() => buildFileTree(contentItems), [contentItems]);

  // Track which item is currently hovered for border management
  const [hoveredItemKey, setHoveredItemKey] = useState(null);
  const onHoverChange = useCallback((key, isHovering) => {
    setHoveredItemKey(isHovering ? key : null);
  }, []);

  if (isLoading) {
    return (
      <Box sx={styles.stateContainer}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Loading files...
        </Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={styles.stateContainer}>
        <Typography
          variant="bodySmall"
          color="error.main"
        >
          Failed to load files
        </Typography>
      </Box>
    );
  }

  if (fileTree.length === 0) {
    return (
      <Box sx={styles.stateContainer}>
        <Typography
          variant="bodySmall"
          color="text.button.disabled"
        >
          No files in this bucket
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.filesContainer}>
      {fileTree.map((item, index) => (
        <FileTreeItem
          key={item.key}
          item={item}
          bucket={bucket}
          onSelectFile={onSelectFile}
          onSelectFolder={onSelectFolder}
          selectedFile={selectedFile}
          selectedBucketName={selectedBucketName}
          currentPrefix={currentPrefix}
          expandedPaths={expandedPaths}
          nextItem={fileTree[index + 1] || null}
          hoveredItemKey={hoveredItemKey}
          onHoverChange={onHoverChange}
          isNextSiblingHighlighted={index === fileTree.length - 1 && isNextBucketHighlighted}
        />
      ))}
    </Box>
  );
});

BucketContent.displayName = 'BucketContent';

/** @type {MuiSx} */
const bucketContentStyles = () => ({
  stateContainer: {
    pl: '2rem',
    py: '0.5rem',
  },
  filesContainer: {
    pl: '1.5rem',
    minWidth: 'max-content',
  },
});

export default BucketContent;
