import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, Tooltip } from '@mui/material';

import { ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';
import RouteDefinitions from '@/routes';

const ScheduleActionsCell = memo(props => {
  const { row } = props;
  const actions = useScheduleRowActions(row);
  const navigate = useNavigate();
  const onEdit = useCallback(() => navigate(`${RouteDefinitions.Schedules}/${row.id}`), [navigate, row.id]);

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
          {...actions}
        />
      </Box>
    </Tooltip>
  );
});

ScheduleActionsCell.displayName = 'ScheduleActionsCell';

export default ScheduleActionsCell;
