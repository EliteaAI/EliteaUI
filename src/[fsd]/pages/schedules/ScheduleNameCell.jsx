import { memo } from 'react';

import { Box } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';

// The name and description lines of the Agents and Pipelines list view (widgets/data-table DataTableNameCell)
const ScheduleNameCell = memo(props => {
  const { row } = props;
  const styles = scheduleNameCellStyles();

  return (
    <Box sx={styles.textContainer}>
      <Tooltip.TypographyWithConditionalTooltip
        data-testid="schedule-name"
        title={row.name}
        placement="top"
        variant="headingSmall"
        color="text.secondary"
        sx={styles.text}
      >
        {row.name}
      </Tooltip.TypographyWithConditionalTooltip>
      {row.description && (
        <Tooltip.TypographyWithConditionalTooltip
          data-testid="schedule-description"
          title={row.description}
          placement="top"
          variant="bodySmall"
          color="text.primary"
          sx={styles.text}
        >
          {row.description}
        </Tooltip.TypographyWithConditionalTooltip>
      )}
    </Box>
  );
});

ScheduleNameCell.displayName = 'ScheduleNameCell';

/** @type {MuiSx} */
const scheduleNameCellStyles = () => ({
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  text: {
    maxWidth: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
});

export default ScheduleNameCell;
