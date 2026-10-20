import { memo, useMemo } from 'react';

import DotMenu from '@/components/DotMenu';

const ScheduleRowActions = memo(props => {
  const { row, onRun, onPause, onResume, onDelete, isBusy } = props;
  const allowed = row.allowed_actions;

  const items = useMemo(
    () =>
      [
        allowed?.includes('run') && { key: 'run', label: 'Run now', onClick: onRun },
        row.enabled && allowed?.includes('pause') && { key: 'pause', label: 'Pause', onClick: onPause },
        !row.enabled && allowed?.includes('resume') && { key: 'resume', label: 'Resume', onClick: onResume },
        allowed?.includes('delete') && {
          key: 'delete',
          label: 'Delete',
          entityName: row.name,
          onConfirm: onDelete,
        },
      ].filter(Boolean),
    [allowed, row.enabled, row.name, onRun, onPause, onResume, onDelete],
  );

  if (!items.length) return null;

  return (
    <DotMenu
      id={`schedule-${row.id}`}
      disabled={isBusy}
    >
      {items}
    </DotMenu>
  );
});

ScheduleRowActions.displayName = 'ScheduleRowActions';

export default ScheduleRowActions;
