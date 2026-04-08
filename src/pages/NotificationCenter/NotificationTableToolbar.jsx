import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import MarkReadIcon from '@/assets/icons/mark-read-icon.svg?react';
import MarkUnreadIcon from '@/assets/icons/mark-unread-icon.svg?react';
import DeleteEntityButton from '@/components/DeleteEntityButton';

const NotificationTableToolbar = memo(props => {
  const { rowSelectionModel, onDeleteSelected, onMarkToggle, markAsRead: shouldMarkAsRead } = props;
  const isSelectionEmpty = !rowSelectionModel?.length;
  const markToggleLabel = shouldMarkAsRead ? 'Mark selected as read' : 'Mark selected as unread';
  const MarkIcon = shouldMarkAsRead ? MarkReadIcon : MarkUnreadIcon;
  const styles = notificationTableToolbarStyles();

  return (
    <Box sx={styles.toolbarContainer}>
      <Box sx={styles.leftSection}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Notifications Center
        </Typography>
      </Box>
      <Box sx={styles.rightSection}>
        <Tooltip
          title={markToggleLabel}
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              startIcon={<MarkIcon />}
              aria-label={markToggleLabel}
              onClick={onMarkToggle}
              disabled={isSelectionEmpty}
            />
          </Box>
        </Tooltip>
        <DeleteEntityButton
          name="selected notifications"
          entity_name="notification"
          onDelete={onDeleteSelected}
          title="Delete selected notifications"
          isLoading={false}
          buttonColor="secondary"
          buttonClassName="action"
          disabled={isSelectionEmpty}
          shouldRequestInputName={false}
        />
      </Box>
    </Box>
  );
});

NotificationTableToolbar.displayName = 'NotificationTableToolbar';

/** @type {MuiSx} */
const notificationTableToolbarStyles = () => ({
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
    gap: '0.5rem',
    overflow: 'hidden',
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.6rem',
  },
});

export default NotificationTableToolbar;
