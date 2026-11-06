import { memo, useId } from 'react';

import { Box, Typography } from '@mui/material';

const toolLabel = ({ toolkit, tool, count }) => {
  const name = [toolkit, tool].filter(Boolean).join(' · ');
  return count > 1 ? `${name} x ${count}` : name;
};

const toLabels = tools => (Array.isArray(tools) ? tools.map(toolLabel) : []);

/**
 * The tools a paused run waits for (`tools`, with `hidden` for those the server left out) and the tools that
 * may ask for approval later in the run (`later_tools`). Names only, shown as plain text.
 */
const ScheduleWaitingTools = memo(props => {
  const { pausedEvent } = props;
  const laterId = useId();
  const styles = scheduleWaitingToolsStyles();
  const pending = toLabels(pausedEvent?.tools);
  const hidden = Number(pausedEvent?.hidden) > 0 ? Number(pausedEvent.hidden) : 0;
  const later = toLabels(pausedEvent?.later_tools);

  return (
    <>
      {(pending.length > 0 || hidden > 0) && (
        <Box
          component="ul"
          data-testid="schedule-waiting-tools"
          aria-label="Tools waiting for approval"
          sx={styles.list}
        >
          {pending.map((label, index) => (
            <Typography
              key={`${label}-${index}`}
              component="li"
              variant="bodySmall"
            >
              {label}
            </Typography>
          ))}
          {hidden > 0 && (
            <Typography
              component="li"
              variant="bodySmall"
            >{`+${hidden} more`}</Typography>
          )}
        </Box>
      )}
      {later.length > 0 && (
        <Box>
          <Typography
            id={laterId}
            variant="bodySmall"
            color="text.secondary"
          >
            May ask for approval later in this run
          </Typography>
          <Box
            component="ul"
            data-testid="schedule-waiting-later-tools"
            aria-labelledby={laterId}
            sx={styles.list}
          >
            {later.map((label, index) => (
              <Typography
                key={`${label}-${index}`}
                component="li"
                variant="bodySmall"
                color="text.secondary"
              >
                {label}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
});

ScheduleWaitingTools.displayName = 'ScheduleWaitingTools';

/** @type {MuiSx} */
const scheduleWaitingToolsStyles = () => ({
  list: { margin: 0, paddingLeft: '1.25rem', overflowWrap: 'anywhere' },
});

export default ScheduleWaitingTools;
