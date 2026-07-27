import { memo } from 'react';

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, IconButton, Tooltip } from '@mui/material';

import { Switch } from '@/[fsd]/shared/ui';

const RunIndexScheduleAction = memo(props => {
  const { enabled, disabledReason, onConfigure, onToggle } = props;
  const styles = runIndexScheduleActionStyles();

  return (
    <Box sx={styles.scheduleSummaryActions}>
      <Tooltip
        title={enabled ? 'Configure schedule' : ''}
        placement="top"
      >
        <Box component="span">
          <IconButton
            size="small"
            disabled={!enabled || Boolean(disabledReason)}
            onClick={e => {
              e.stopPropagation();
              onConfigure();
            }}
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
      <Tooltip
        title={disabledReason || ''}
        placement="top"
      >
        <Box component="span">
          <Switch.BaseSwitch
            checked={enabled}
            onChange={onToggle}
            disabled={Boolean(disabledReason)}
          />
        </Box>
      </Tooltip>
    </Box>
  );
});

RunIndexScheduleAction.displayName = 'RunIndexScheduleAction';

/** @type {MuiSx} */
const runIndexScheduleActionStyles = () => ({
  scheduleSummaryActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
});

export default RunIndexScheduleAction;
