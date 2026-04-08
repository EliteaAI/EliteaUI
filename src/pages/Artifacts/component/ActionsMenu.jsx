import React, { memo, useMemo } from 'react';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { PERMISSIONS } from '@/common/constants';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import InfoIcon from '@/components/Icons/InfoIcon';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';
import {
  canPreviewFile,
  formatFileSize,
  getPreviewSizeLimit,
  isFileSizePreviewableFlexible,
} from '@/utils/filePreview';

const PREVIEW_TYPES = {
  EMPTY: 'empty',
  PREVIEW: 'preview',
  TOO_LARGE: 'tooLarge',
};

const ActionsMenu = memo(
  ({
    actionsMenuAnchorEl,
    currentRowForActions,
    checkPermission,
    handleActionsMenuClose,
    handleMenuPreview,
    handleMenuDownload,
    handleMenuDelete,
  }) => {
    const theme = useTheme();
    const styles = actionsMenuStyles();
    const sizeLimit = getPreviewSizeLimit();

    const previewMenuItemType = useMemo(() => {
      if (!currentRowForActions || !canPreviewFile(currentRowForActions.name)) return PREVIEW_TYPES.EMPTY;
      if (isFileSizePreviewableFlexible(currentRowForActions)) return PREVIEW_TYPES.PREVIEW;
      return PREVIEW_TYPES.TOO_LARGE;
    }, [currentRowForActions]);

    return (
      <Menu
        anchorEl={actionsMenuAnchorEl}
        open={Boolean(actionsMenuAnchorEl)}
        onClose={handleActionsMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {(() => {
          switch (previewMenuItemType) {
            case PREVIEW_TYPES.EMPTY:
              return null;
            case PREVIEW_TYPES.PREVIEW:
              return (
                <MenuItem onClick={handleMenuPreview}>
                  <ListItemIcon>
                    <OpenEyeIcon sx={styles.menuItemOpenEyeIcon} />
                  </ListItemIcon>
                  <ListItemText>Preview file</ListItemText>
                </MenuItem>
              );
            default:
              return (
                <MenuItem disabled>
                  <ListItemIcon>
                    <InfoIcon sx={styles.menuItemInfoIcon} />
                  </ListItemIcon>
                  <ListItemText
                    primary="File too large to preview"
                    secondary={
                      <div>
                        {formatFileSize(currentRowForActions.size)} exceeds {formatFileSize(sizeLimit)} limit.
                        <br />
                        Please download to view.
                      </div>
                    }
                  />
                </MenuItem>
              );
          }
        })()}
        {currentRowForActions && (
          <MenuItem onClick={handleMenuDownload}>
            <ListItemIcon>
              <FileDownloadOutlinedIcon sx={styles.menuItemFileDownloadOutlined} />
            </ListItemIcon>
            <ListItemText>Download file</ListItemText>
          </MenuItem>
        )}
        {currentRowForActions && checkPermission(PERMISSIONS.artifacts.delete) && (
          <MenuItem onClick={handleMenuDelete}>
            <ListItemIcon>
              <DeleteEntityButton
                name={currentRowForActions.name || 'file'}
                entity_name="file"
                title="Delete file"
                isLoading={false}
                sx={styles.menuItemDeleteEntityButton}
                buttonColor="tertiary"
                buttonClassName="action"
                iconColor={theme.palette.icon.fill.default}
                shouldRequestInputName={false}
                iconOnly={true}
              />
            </ListItemIcon>
            <ListItemText>Delete file</ListItemText>
          </MenuItem>
        )}
      </Menu>
    );
  },
);

// Styles

const actionsMenuStyles = () => ({
  menuItemOpenEyeIcon: ({ palette }) => ({
    color: palette.icon.fill.default,
    fontSize: '1rem',
  }),
  menuItemInfoIcon: ({ palette }) => ({
    color: palette.icon.fill.secondary,
    fontSize: '1rem',
  }),
  menuItemFileDownloadOutlined: ({ palette }) => ({
    color: palette.icon.fill.default,
    fontSize: '1rem',
  }),
  menuItemDeleteEntityButton: {
    padding: '0',
    minWidth: '1rem',
    width: '1rem',
    height: '1rem',
  },
});

ActionsMenu.displayName = 'ActionsMenu';

export default ActionsMenu;
