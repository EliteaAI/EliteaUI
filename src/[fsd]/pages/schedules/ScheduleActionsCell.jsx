import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, Tooltip } from '@mui/material';

import { buildScheduleRunsLink } from '@/[fsd]/entities/schedule';
import { ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';
import RouteDefinitions from '@/routes';

const ScheduleActionsCell = memo(props => {
  const { row } = props;
  const actions = useScheduleRowActions(row);
  const navigate = useNavigate();
  const onEdit = useCallback(() => navigate(`${RouteDefinitions.Schedules}/${row.id}`), [navigate, row.id]);
  // The same edit page with its Runs section open, as the card menu of the editors does
  const onOpenRunHistory = useCallback(
    () => navigate(buildScheduleRunsLink({ scheduleId: row.id })),
    [navigate, row.id],
  );

  return (
    <Tooltip
      title="More actions"
      placement="top"
      describeChild
    >
      <Box component="span">
        <ScheduleRowActions
          row={row}
          onEdit={onEdit}
          onOpenRunHistory={onOpenRunHistory}
          {...actions}
        />
      </Box>
    </Tooltip>
  );
});

ScheduleActionsCell.displayName = 'ScheduleActionsCell';

export default ScheduleActionsCell;
