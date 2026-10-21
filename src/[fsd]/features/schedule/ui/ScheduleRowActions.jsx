import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import DotMenu from '@/components/DotMenu';

import ChangeOwnerDialog from './ChangeOwnerDialog';

const ScheduleRowActions = memo(props => {
  // onOpenRunHistory and hideChangeOwner shape the card menu of the editor Schedules section (US-35)
  const { row, onRun, onEdit, onOpenRunHistory, onPause, onResume, onDelete, isBusy, hideChangeOwner } =
    props;
  const allowed = row.allowed_actions;
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const openOwnerDialog = useCallback(() => setIsOwnerDialogOpen(true), []);
  const closeOwnerDialog = useCallback(() => setIsOwnerDialogOpen(false), []);

  const items = useMemo(
    () =>
      [
        allowed?.includes('run') && { key: 'run', label: 'Run now', onClick: onRun },
        allowed?.includes('edit') && { key: 'edit', label: 'Edit', onClick: onEdit },
        row.enabled && allowed?.includes('pause') && { key: 'pause', label: 'Pause', onClick: onPause },
        !row.enabled && allowed?.includes('resume') && { key: 'resume', label: 'Resume', onClick: onResume },
        onOpenRunHistory &&
          allowed?.includes('edit') && {
            key: 'history',
            label: 'Open run history',
            onClick: onOpenRunHistory,
          },
        !hideChangeOwner &&
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
    [
      allowed,
      row.enabled,
      row.name,
      onRun,
      onEdit,
      onOpenRunHistory,
      onPause,
      onResume,
      onDelete,
      openOwnerDialog,
      hideChangeOwner,
    ],
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
