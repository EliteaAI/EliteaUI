import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';
import RouteDefinitions from '@/routes';

const ScheduleActionsCell = memo(props => {
  const { row } = props;
  const actions = useScheduleRowActions(row);
  const navigate = useNavigate();
  const onEdit = useCallback(() => navigate(`${RouteDefinitions.Schedules}/${row.id}`), [navigate, row.id]);

  return (
    <ScheduleRowActions
      row={row}
      onEdit={onEdit}
      {...actions}
    />
  );
});

ScheduleActionsCell.displayName = 'ScheduleActionsCell';

export default ScheduleActionsCell;
