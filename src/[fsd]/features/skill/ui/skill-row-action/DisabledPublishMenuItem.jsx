import { memo } from 'react';

import { MenuItem, Tooltip, Typography } from '@mui/material';

import PublishIcon from '@/assets/publish-icon.svg?react';

import { skillRowMenuItemStyles } from './SkillRowMenuItem';

const PUBLISH_DISABLED_TOOLTIP = 'Available in future release';

const DisabledPublishMenuItem = memo(() => {
  const styles = skillRowMenuItemStyles();

  return (
    <Tooltip
      title={PUBLISH_DISABLED_TOOLTIP}
      placement="left"
      arrow
    >
      <span>
        <MenuItem
          disabled
          sx={styles.menuItem}
        >
          <PublishIcon />
          <Typography variant="labelMedium">Publish</Typography>
        </MenuItem>
      </span>
    </Tooltip>
  );
});

DisabledPublishMenuItem.displayName = 'DisabledPublishMenuItem';

export default DisabledPublishMenuItem;
