import { memo, useCallback, useMemo } from 'react';

import GroupsIcon from '@mui/icons-material/Groups';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Box, Tooltip, Typography } from '@mui/material';

import { ARTIFACT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/artifactTourTargets.constants';
import { Button } from '@/[fsd]/shared/ui';
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
    isManagingAccess = false,
    onManageAccessToggle,
    isPersonalProject = false,
    accessManagementControls = null,
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
        {isManagingAccess ? (
          <Typography
            variant="headingSmall"
            sx={styles.bucketName}
          >
            Manage access ({bucket})
          </Typography>
        ) : (
          <>
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
          </>
        )}
      </Box>

      {/* Right side: Search and action buttons */}
      <Box sx={styles.rightSection}>
        {isManagingAccess ? (
          <>
            {accessManagementControls}
            {bucket && (
              <Tooltip
                title="Back to files"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant="icon"
                    sx={styles.actionButton}
                    onClick={onManageAccessToggle}
                  >
                    <InsertDriveFileOutlinedIcon sx={styles.actionIcon} />
                  </Button.BaseBtn>
                </Box>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <Box
              sx={styles.searchWrapper}
              data-testid="artifacts-file-search-input"
            >
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

            {!isPersonalProject && bucket && checkPermission(PERMISSIONS.artifacts.buckets.update) && (
              <Tooltip
                title="Manage access"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant="icon"
                    sx={styles.actionButton}
                    onClick={onManageAccessToggle}
                  >
                    <GroupsIcon sx={styles.actionIcon} />
                  </Button.BaseBtn>
                </Box>
              </Tooltip>
            )}

            {checkPermission(PERMISSIONS.artifacts.create) && bucket && (
              <Tooltip
                title="Upload files"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant="icon"
                    sx={styles.actionButton}
                    onClick={handleUploadClick}
                    data-tour={ARTIFACT_TOUR_TARGET_IDS.uploadButton}
                    data-testid="artifacts-upload-files-button"
                  >
                    <FileUploadIcon sx={styles.actionIcon} />
                  </Button.BaseBtn>
                </Box>
              </Tooltip>
            )}

            <Tooltip
              title="Download files"
              placement="top"
            >
              <Box component="span">
                <Button.BaseBtn
                  variant="icon"
                  sx={styles.actionButton}
                  onClick={onDownloadFiles}
                  disabled={!rowSelectionModel.length}
                  data-testid="artifacts-download-files-button"
                >
                  <DownloadIcon sx={styles.actionIcon} />
                </Button.BaseBtn>
              </Box>
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
          </>
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
