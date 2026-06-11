import { memo, useCallback, useState } from 'react';

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import RefreshIcon from '@/assets/refresh-icon.svg?react';
import VersionIcon from '@/assets/version-icon.svg?react';
import useNavBlocker from '@/hooks/useNavBlocker';

const VersionSelector = memo(props => {
  const {
    versions,
    selectedVersion,
    onSelect,
    onCloseEditor,
    isEditorDirty,
    onShowVersionChangeAlert,
    isSmallView,
    onRefresh,
  } = props;

  const styles = versionSelectorStyles();

  const [versionSelectAnchorEl, setVersionSelectAnchorEl] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const versionSelectMenuOpen = Boolean(versionSelectAnchorEl);

  const handleRefresh = useCallback(
    async event => {
      event?.stopPropagation();
      if (!onRefresh) return;

      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        // Small delay to ensure the UI reflects the loading state
        setTimeout(() => setIsRefreshing(false), 500);
      }
    },
    [onRefresh],
  );

  // Get editing state from Redux to check if any editor is open with unsaved changes
  const { isEditingAgent, isEditingPipeline } = useNavBlocker();
  const isAnyEditorOpen = isEditingAgent || isEditingPipeline;

  // TODO: Confirm with Hawk START
  const handleVersionSelect = index => {
    // When we're editing (agent or pipeline) and changes are not saved
    if (isAnyEditorOpen && isEditorDirty) {
      return onShowVersionChangeAlert(() => {
        // Close the editor first to discard changes
        if (onCloseEditor) onCloseEditor();
        // Then change the version
        onSelect(versions[index]);
        handleClose();
      });
    }

    // Close editor if open (no unsaved changes)
    if (onCloseEditor) onCloseEditor();
    // No unsaved changes or not editing, proceed normally
    onSelect(versions[index]);
    handleClose();
  };
  // TODO: Confirm with Hawk END

  const handleVersionMenuClick = event => {
    setVersionSelectAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setVersionSelectAnchorEl(null);
  };

  return (
    <>
      <Tooltip
        placement="top"
        title="Version selector"
      >
        <Button
          size="small"
          aria-expanded={versionSelectMenuOpen ? 'true' : undefined}
          aria-label="version selector menu"
          aria-haspopup="menu"
          onClick={handleVersionMenuClick}
        >
          {isSmallView ? <VersionIcon style={{ fontSize: '1rem' }} /> : selectedVersion?.name}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={versionSelectAnchorEl}
        open={versionSelectMenuOpen}
        onClose={handleClose}
      >
        {onRefresh && (
          <Box sx={styles.refreshWrapper}>
            <Typography
              variant="labelTiny"
              sx={styles.versionsLabel}
            >
              Versions
            </Typography>
            <Tooltip
              title="Refresh versions"
              placement="top"
            >
              <IconButton
                variant="elitea"
                color="tertiary"
                size="small"
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={styles.iconButton}
              >
                {isRefreshing ? (
                  <CircularProgress size={12} />
                ) : (
                  <RefreshIcon style={{ fontSize: '.75rem', width: '.75rem', height: '.75rem' }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {versions.map((item, index) => (
          <MenuItem
            key={index}
            selected={item.id === selectedVersion?.id}
            onClick={() => handleVersionSelect(index)}
          >
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

VersionSelector.displayName = 'VersionSelector';

/**
 * @type MuiSx
 */
const versionSelectorStyles = () => ({
  refreshWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    minHeight: '1.75rem',
    padding: '.25rem .75rem',
  }),
  versionsLabel: ({ palette }) => ({
    color: palette.text.secondary,
    textTransform: 'uppercase',
  }),
  isonButton: { padding: '.125rem', minWidth: '1.25rem', width: '1.25rem', height: '1.25rem' },
});

export default VersionSelector;
