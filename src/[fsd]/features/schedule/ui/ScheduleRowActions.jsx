import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import ClockIcon from '@/assets/clock_icon.svg?react';
import PauseIcon from '@/assets/pause-icon.svg?react';
import ResumeIcon from '@/assets/play.svg?react';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import PersonIcon from '@/components/Icons/Person';
import PlayIcon from '@/components/Icons/PlayIcon';

import { ownerOnlyRunHint } from '../lib/helpers';
import ChangeOwnerDialog from './ChangeOwnerDialog';

// Owner CR : every item shows a small icon; the item sets the colour through currentColor
const ICON_SX = { fontSize: '1rem' };
const SVG_ICON_STYLE = { width: '1rem', height: '1rem' };
// The icon-only menu button needs a name for screen readers
const MENU_BUTTON_PROPS = { 'aria-label': 'More actions' };

const ScheduleRowActions = memo(props => {
  // onOpenRunHistory and hideChangeOwner shape the card menu of the editor Schedules section
  // onExport comes from useScheduleRowActions only with the export permission
  const {
    row,
    onRun,
    onEdit,
    onOpenRunHistory,
    onPause,
    onResume,
    onExport,
    onDelete,
    isBusy,
    hideChangeOwner,
  } = props;
  const allowed = row.allowed_actions;
  const runHint = ownerOnlyRunHint(row);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const openOwnerDialog = useCallback(() => setIsOwnerDialogOpen(true), []);
  const closeOwnerDialog = useCallback(() => setIsOwnerDialogOpen(false), []);

  const styles = scheduleRowActionsStyles();

  const items = useMemo(
    () =>
      [
        (allowed?.includes('run') || runHint) && {
          key: 'run',
          label: 'Run now',
          icon: (
            <PlayIcon
              fill="currentColor"
              sx={ICON_SX}
            />
          ),
          // #7254: shown to an admin, disabled, with who can run it; no handler then
          disabled: !!runHint,
          tooltip: runHint,
          onClick: runHint ? undefined : onRun,
        },
        allowed?.includes('edit') && {
          key: 'edit',
          label: 'Edit',
          icon: (
            <EditIcon
              fill="currentColor"
              sx={ICON_SX}
            />
          ),
          onClick: onEdit,
        },
        row.enabled &&
          allowed?.includes('pause') && {
            key: 'pause',
            label: 'Pause',
            icon: <PauseIcon style={SVG_ICON_STYLE} />,
            onClick: onPause,
          },
        !row.enabled &&
          allowed?.includes('resume') && {
            key: 'resume',
            label: 'Resume',
            icon: <ResumeIcon style={SVG_ICON_STYLE} />,
            onClick: onResume,
          },
        onOpenRunHistory &&
          allowed?.includes('edit') && {
            key: 'history',
            label: 'Open run history',
            icon: <ClockIcon style={SVG_ICON_STYLE} />,
            onClick: onOpenRunHistory,
          },
        !hideChangeOwner &&
          allowed?.includes('change_owner') && {
            key: 'change_owner',
            label: 'Change owner',
            icon: <PersonIcon sx={ICON_SX} />,
            onClick: openOwnerDialog,
          },
        onExport && {
          key: 'export',
          label: 'Export',
          icon: (
            <ExportIcon
              fill="currentColor"
              sx={ICON_SX}
            />
          ),
          onClick: onExport,
        },
        allowed?.includes('delete') && {
          key: 'delete',
          label: 'Delete',
          icon: (
            <DeleteIcon
              fill="currentColor"
              sx={ICON_SX}
            />
          ),
          slotProps: styles.deleteSlotProps,
          entityName: row.name,
          onConfirm: onDelete,
        },
      ].filter(Boolean),
    [
      allowed,
      runHint,
      row.enabled,
      row.name,
      onRun,
      onEdit,
      onOpenRunHistory,
      onPause,
      onResume,
      onExport,
      onDelete,
      openOwnerDialog,
      hideChangeOwner,
      styles.deleteSlotProps,
    ],
  );

  if (!items.length) return null;

  return (
    <Fragment>
      <DotMenu
        id={`schedule-${row.id}`}
        disabled={isBusy}
        slotProps={styles.slotProps}
        anchorButtonProps={MENU_BUTTON_PROPS}
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

const ICON_SLOT = { sx: ({ palette }) => ({ color: palette.icon.default }) };
const DELETE_SLOT_PROPS = {
  ListItemIcon: { sx: ({ palette }) => ({ color: palette.icon.error }) },
  ListItemText: {
    slotProps: {
      primary: { variant: 'labelMedium', sx: ({ palette }) => ({ color: palette.text.error }) },
    },
  },
};

/** @type {MuiSx} */
const scheduleRowActionsStyles = () => ({
  slotProps: { ListItemIcon: ICON_SLOT },
  deleteSlotProps: DELETE_SLOT_PROPS,
});

export default ScheduleRowActions;
