import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import { useScheduleRowActions } from '@/[fsd]/features/schedule';
import { ImportSchedulesDialog } from '@/[fsd]/features/schedule-import-export';
import ImportIcon from '@/assets/import-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import DotMenu from '@/components/DotMenu';
import ExportIcon from '@/components/Icons/ExportIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

const ICON_SX = { fontSize: '1rem' };
const SVG_ICON_STYLE = { width: '1rem', height: '1rem' };
const MENU_BUTTON_PROPS = { 'aria-label': 'More actions' };
const ICON_SLOT = { sx: ({ palette }) => ({ color: palette.icon.default }) };
const SLOT_PROPS = { ListItemIcon: ICON_SLOT };

// CR-16 (US-43 R4.3 to R4.5): Export and Import of the Edit schedule page header, one per permission.
// The pages layer joins the two features: onExport of the row hook and the list import dialog.
const ScheduleDetailMenu = memo(({ schedule, projectId }) => {
  const { onExport } = useScheduleRowActions(schedule);
  const { checkPermission } = useCheckPermission();
  const canImport = checkPermission(PERMISSIONS.schedules.import);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const openImport = useCallback(() => setIsImportOpen(true), []);
  const closeImport = useCallback(() => setIsImportOpen(false), []);

  const items = useMemo(
    () =>
      [
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
        canImport && {
          key: 'import',
          label: 'Import',
          icon: <ImportIcon style={SVG_ICON_STYLE} />,
          onClick: openImport,
        },
      ].filter(Boolean),
    [onExport, canImport, openImport],
  );

  if (!items.length) return null;

  return (
    <Fragment>
      <DotMenu
        id="schedule-detail"
        slotProps={SLOT_PROPS}
        anchorButtonProps={MENU_BUTTON_PROPS}
      >
        {items}
      </DotMenu>
      {isImportOpen && (
        <ImportSchedulesDialog
          open
          onClose={closeImport}
          projectId={projectId}
        />
      )}
    </Fragment>
  );
});

ScheduleDetailMenu.displayName = 'ScheduleDetailMenu';

export default ScheduleDetailMenu;
