import { memo } from 'react';

import { ScheduleRowActions } from '@/[fsd]/features/schedule';
import { useScheduleRowActions } from '@/[fsd]/features/schedule/lib/hooks/useScheduleRowActions.hooks';

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
