import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import FileUploadIcon from '@/assets/icons/FileUploadIcon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useTheme } from '@emotion/react';

import BreadcrumbNavigation from './BreadcrumbNavigation';
import BucketInfoTooltip from './BucketInfoTooltip';

const ArtifactTableToolbar = memo(props => {
  const {
    fileInputRef,
    handleFileChange,
    selectedBucketData,
    fileCount,
    onDownloadFiles,
    rowSelectionModel,
    handleUploadClick,
    bucket,
    onDeleteArtifacts,
    totalRows,
    searchQuery = '',
    onSearchChange,
    breadcrumbs = [],
    onBreadcrumbClick,
    currentPrefix,
  } = props;

  const { checkPermission } = useCheckPermission();
  const theme = useTheme();
  const styles = artifactTableToolbarStyles();

  const handleRootClick = useCallback(() => {
    if (onBreadcrumbClick) {
      onBreadcrumbClick('');
    }
  }, [onBreadcrumbClick]);

  const rootBucketSx = useMemo(
    () => [styles.bucketName, currentPrefix && styles.breadcrumbLink].filter(Boolean),
    [styles, currentPrefix],
  );

  const deleteButtonIconColor = !rowSelectionModel.length
    ? theme.palette.icon.fill.disabled
    : theme.palette.icon.fill.default;

  return (
    <Box sx={styles.toolbarContainer}>
      {/* Left side: Bucket name with breadcrumbs and info icon */}
      <Box sx={styles.leftSection}>
        <Typography
          variant="headingSmall"
          sx={rootBucketSx}
          onClick={currentPrefix ? handleRootClick : undefined}
        >
          {bucket}
        </Typography>

        <BreadcrumbNavigation
          breadcrumbs={breadcrumbs}
          bucketName={bucket}
          onBreadcrumbClick={onBreadcrumbClick}
        />

        <BucketInfoTooltip
          retentionDays={selectedBucketData?.retentionDays}
          fileCount={fileCount}
        />
      </Box>

      {/* Right side: Search and action buttons */}
      <Box sx={styles.rightSection}>
        <Box sx={styles.searchWrapper}>
          <SimpleSearchBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            placeholder="Search"
            autoFocus={false}
          />
        </Box>

        {/* Hidden file input for upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {checkPermission(PERMISSIONS.artifacts.create) && bucket && (
          <Tooltip
            title="Upload files"
            placement="top"
          >
            <IconButton
              variant={'elitea'}
              sx={styles.actionButton}
              size="small"
              color="secondary"
              onClick={handleUploadClick}
            >
              <FileUploadIcon sx={styles.actionIcon} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip
          title="Download files"
          placement="top"
        >
          <IconButton
            variant={'elitea'}
            sx={styles.actionButton}
            size="small"
            color="secondary"
            onClick={onDownloadFiles}
            disabled={!rowSelectionModel.length}
          >
            <DownloadIcon sx={styles.actionIcon} />
          </IconButton>
        </Tooltip>

        {checkPermission(PERMISSIONS.artifacts.delete) && (
          <DeleteEntityButton
            name={rowSelectionModel.length === totalRows ? 'all files' : 'selected files'}
            entity_name={'file'}
            onDelete={onDeleteArtifacts}
            title={`Delete ${rowSelectionModel.length === totalRows ? 'all files' : 'selected files'}`}
            isLoading={false}
            sx={styles.deleteEntityButton}
            buttonColor="secondary"
            buttonClassName="action"
            iconColor={deleteButtonIconColor}
            disabled={!rowSelectionModel.length}
            shouldRequestInputName={false}
          />
        )}
      </Box>
    </Box>
  );
});

ArtifactTableToolbar.displayName = 'ArtifactTableToolbar';

/** @type {MuiSx} */
const artifactTableToolbarStyles = () => ({
  toolbarContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '1rem',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.4rem',
    overflow: 'hidden',
  },
  bucketName: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
  }),
  breadcrumbLink: ({ palette }) => ({
    cursor: 'pointer',
    '&:hover': {
      color: palette.primary.main,
      textDecoration: 'underline',
    },
  }),
  breadcrumbItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.25rem',
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.6rem',
  },
  searchWrapper: {
    minWidth: '12.5rem',
  },
  actionButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
  }),
  actionIcon: {
    width: '1rem',
    height: '1rem',
  },
  deleteEntityButton: {
    borderRadius: '50%',
  },
});

export default ArtifactTableToolbar;
