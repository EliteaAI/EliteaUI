import { memo } from 'react';

import { Link as RouterLink, useLocation } from 'react-router-dom';

import { Box, Link } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';
import RouteDefinitions from '@/routes';

// The name and description lines of the Agents and Pipelines list view (widgets/data-table DataTableNameCell)
const ScheduleNameCell = memo(props => {
  const { row } = props;
  const { pathname, search } = useLocation();
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
        <Link
          component={RouterLink}
          to={`${RouteDefinitions.Schedules}/${row.id}`}
          state={{ returnTo: pathname + search }}
          color="inherit"
          underline="hover"
        >
          {row.name}
        </Link>
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
