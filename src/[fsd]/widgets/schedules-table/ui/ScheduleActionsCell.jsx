import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, Tooltip } from '@mui/material';

import { TRIGGER_KIND, buildScheduleRunsLink, getListRoute } from '@/[fsd]/entities/schedule';
import { ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';

const ScheduleActionsCell = memo(props => {
  const { row } = props;
  const actions = useScheduleRowActions(row);
  const navigate = useNavigate();
  const kind = row.trigger_kind ?? TRIGGER_KIND.cron;
  const onEdit = useCallback(() => navigate(`${getListRoute(kind)}/${row.id}`), [navigate, row.id, kind]);
  // The same edit page with its Runs section open, as the card menu of the editors does
  const onOpenRunHistory = useCallback(
    () => navigate(buildScheduleRunsLink({ scheduleId: row.id, kind })),
    [navigate, row.id, kind],
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
