import { memo } from 'react';

import { ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';

const ScheduleActionsCell = memo(props => {
  const { row } = props;
  const actions = useScheduleRowActions(row);

  return (
    <ScheduleRowActions
      row={row}
      {...actions}
    />
  );
});

ScheduleActionsCell.displayName = 'ScheduleActionsCell';

export default ScheduleActionsCell;
