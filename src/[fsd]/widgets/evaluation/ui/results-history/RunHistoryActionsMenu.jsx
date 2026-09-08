import { memo, useCallback, useState } from 'react';

import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Box, CircularProgress, Menu, MenuItem, SvgIcon, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DownloadIcon from '@/assets/download.svg?react';
import ShareIcon from '@/assets/share-icon.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const RUN_ACTION = {
  share: 'share',
  export: 'export',
  delete: 'delete',
};

const ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'right' };

const RunHistoryActionsMenu = memo(props => {
  const { run, canDelete = false, exportingRunId = null, onShare, onExport, onDelete } = props;

  // Any export in flight disables the action everywhere, so a second one cannot be started — but
  // only the row being exported shows the spinner.
  const isExportingThisRun = exportingRunId != null && exportingRunId === run?.id;
  const isExportDisabled = exportingRunId != null;

  const [anchorEl, setAnchorEl] = useState(null);

  // The row underneath treats a click as "select this run"; opening the menu must not move the
  // selection out from under the action the user is about to pick (§6).
  const handleOpenMenu = useCallback(event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(event => {
    event?.stopPropagation?.();
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (event, action) => {
      event.stopPropagation();
      setAnchorEl(null);
      switch (action) {
        case RUN_ACTION.share:
          onShare?.(run);
          break;
        case RUN_ACTION.export:
          onExport?.(run);
          break;
        case RUN_ACTION.delete:
          onDelete?.(run);
          break;
        default:
          break;
      }
    },
    [run, onShare, onExport, onDelete],
  );

  const styles = runHistoryActionsMenuStyles();

  return (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.tertiary}
        onClick={handleOpenMenu}
        sx={styles.trigger}
        data-testid={`run-history-actions-${run?.id}`}
      >
        <MoreVertIcon sx={styles.triggerIcon} />
      </Button.BaseBtn>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={ANCHOR_ORIGIN}
        transformOrigin={TRANSFORM_ORIGIN}
        slotProps={{ paper: { sx: styles.menuPaper } }}
      >
        <MenuItem
          onClick={event => handleMenuItemClick(event, RUN_ACTION.share)}
          sx={styles.menuItem}
          data-testid="run-history-share"
        >
          <SvgIcon
            component={ShareIcon}
            inheritViewBox
            sx={styles.menuIcon}
          />
          <Typography sx={styles.menuText}>Share</Typography>
        </MenuItem>
        <MenuItem
          onClick={event => handleMenuItemClick(event, RUN_ACTION.export)}
          disabled={isExportDisabled}
          sx={styles.menuItem}
          data-testid="run-history-export"
        >
          {isExportingThisRun ? (
            <CircularProgress
              size={16}
              sx={styles.menuIcon}
            />
          ) : (
            <SvgIcon
              component={DownloadIcon}
              inheritViewBox
              sx={styles.menuIcon}
            />
          )}
          <Typography sx={styles.menuText}>Export to Excel</Typography>
        </MenuItem>
        {canDelete && (
          <MenuItem
            onClick={event => handleMenuItemClick(event, RUN_ACTION.delete)}
            sx={styles.menuItem}
            data-testid="run-history-delete"
          >
            <Box
              component="span"
              sx={styles.deleteIconWrapper}
            >
              <DeleteIcon />
            </Box>
            <Typography sx={styles.menuText}>Delete</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
});

RunHistoryActionsMenu.displayName = 'RunHistoryActionsMenu';

/** @type {MuiSx} */
const runHistoryActionsMenuStyles = () => ({
  trigger: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: 0,
    borderRadius: '50%',
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  triggerIcon: ({ palette }) => ({
    fontSize: '1.125rem',
    color: palette.icon.fill.default,
  }),
  menuPaper: ({ palette }) => ({
    minWidth: '11rem',
    backgroundColor: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    marginTop: '0.25rem',

    '>ul': {
      padding: '0.25rem 0',
    },
  }),
  menuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.default.secondary,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  menuIcon: ({ palette }) => ({
    fontSize: '1rem',
    flexShrink: 0,
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  deleteIconWrapper: ({ palette }) => ({
    display: 'inline-flex',
    flexShrink: 0,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  menuText: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
});

export default RunHistoryActionsMenu;
