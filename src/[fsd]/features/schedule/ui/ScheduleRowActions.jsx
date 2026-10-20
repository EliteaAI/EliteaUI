import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import DotMenu from '@/components/DotMenu';

import ChangeOwnerDialog from './ChangeOwnerDialog';

const ScheduleRowActions = memo(props => {
  const { row, onRun, onPause, onResume, onDelete, isBusy } = props;
  const allowed = row.allowed_actions;
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const openOwnerDialog = useCallback(() => setIsOwnerDialogOpen(true), []);
  const closeOwnerDialog = useCallback(() => setIsOwnerDialogOpen(false), []);

  const items = useMemo(
    () =>
      [
        allowed?.includes('run') && { key: 'run', label: 'Run now', onClick: onRun },
        row.enabled && allowed?.includes('pause') && { key: 'pause', label: 'Pause', onClick: onPause },
        !row.enabled && allowed?.includes('resume') && { key: 'resume', label: 'Resume', onClick: onResume },
        allowed?.includes('change_owner') && {
          key: 'change_owner',
          label: 'Change owner',
          onClick: openOwnerDialog,
        },
        allowed?.includes('delete') && {
          key: 'delete',
          label: 'Delete',
          entityName: row.name,
          onConfirm: onDelete,
        },
      ].filter(Boolean),
    [allowed, row.enabled, row.name, onRun, onPause, onResume, onDelete, openOwnerDialog],
  );

  if (!items.length) return null;

  return (
    <Fragment>
      <DotMenu
        id={`schedule-${row.id}`}
        disabled={isBusy}
      >
        {items}
      </DotMenu>
      {isOwnerDialogOpen && (
        <ChangeOwnerDialog
          open
          schedule={{ id: row.id, name: row.name, owner: row.owner }}
          onClose={closeOwnerDialog}
        />
      )}
    </Fragment>
  );
});

ScheduleRowActions.displayName = 'ScheduleRowActions';

export default ScheduleRowActions;
