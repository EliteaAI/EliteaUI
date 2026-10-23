import { memo, useMemo } from 'react';

import { useScheduleRowActions } from '@/[fsd]/features/schedule';
import DotMenu from '@/components/DotMenu';
import ExportIcon from '@/components/Icons/ExportIcon';

const ICON_SX = { fontSize: '1rem' };
const MENU_BUTTON_PROPS = { 'aria-label': 'More actions' };
const ICON_SLOT = { sx: ({ palette }) => ({ color: palette.icon.default }) };
const SLOT_PROPS = { ListItemIcon: ICON_SLOT };

// CR-16, CR-27 (US-43 R4.3 to R4.5): Export of the Edit schedule page header.
// The row hook gives onExport only with the schedules.export permission; without it there is no menu.
const ScheduleDetailMenu = memo(({ schedule }) => {
  const { onExport, isBusy } = useScheduleRowActions(schedule);

  const items = useMemo(
    () =>
      onExport
        ? [
            {
              key: 'export',
              label: 'Export',
              icon: (
                <ExportIcon
                  fill="currentColor"
                  sx={ICON_SX}
                />
              ),
              onClick: onExport,
              disabled: isBusy,
            },
          ]
        : [],
    [onExport, isBusy],
  );

  if (!items.length) return null;

  return (
    <DotMenu
      id="schedule-detail"
      slotProps={SLOT_PROPS}
      anchorButtonProps={MENU_BUTTON_PROPS}
    >
      {items}
    </DotMenu>
  );
});

ScheduleDetailMenu.displayName = 'ScheduleDetailMenu';

export default ScheduleDetailMenu;
