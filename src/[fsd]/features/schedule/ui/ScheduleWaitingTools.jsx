import { memo } from 'react';

import { List, ListItem, Typography } from '@mui/material';

import { formatTool } from '../lib/helpers';

/**
 * The sensitive tools a paused run waits to have approved, one line each. `moreCount` is the number of
 * tools the server left out of the list; it is shown under the list.
 */
const ScheduleWaitingTools = memo(props => {
  const { tools, moreCount = 0 } = props;
  const styles = scheduleWaitingToolsStyles();

  if (!tools?.length) return null;

  return (
    <>
      <List
        data-testid="schedule-waiting-tools"
        aria-label="Sensitive tools to approve"
        sx={styles.list}
      >
        {tools.map((item, index) => (
          <ListItem
            key={`${formatTool(item)}-${index}`}
            sx={styles.item}
          >
            <Typography variant="bodySmall">{formatTool(item)}</Typography>
          </ListItem>
        ))}
      </List>
      {moreCount > 0 && (
        <Typography
          data-testid="schedule-waiting-tools-more"
          variant="bodySmall"
          color="text.secondary"
        >
          {`The list is cut: ${moreCount} more not shown.`}
        </Typography>
      )}
    </>
  );
});

ScheduleWaitingTools.displayName = 'ScheduleWaitingTools';

/** @type {MuiSx} */
const scheduleWaitingToolsStyles = () => ({
  list: ({ palette }) => ({
    margin: 0,
    padding: '0 0 0 1.5rem',
    listStyleType: 'disc',
    color: palette.text.primary,
  }),
  item: { display: 'list-item', padding: 0 },
});

export default ScheduleWaitingTools;
