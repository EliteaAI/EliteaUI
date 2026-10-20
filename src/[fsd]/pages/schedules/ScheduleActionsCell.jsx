import { memo } from 'react';

import DotMenu from '@/components/DotMenu';

// lean: no menu items yet, so the kebab is disabled; US-28 and US-29 add Run now, Pause and Delete
const ScheduleActionsCell = memo(props => {
  const { row } = props;
  const styles = scheduleActionsCellStyles();

  return (
    <DotMenu
      id={`schedule-${row.id}`}
      disabled
      menuIconSX={styles.menuIcon}
    >
      {[]}
    </DotMenu>
  );
});

ScheduleActionsCell.displayName = 'ScheduleActionsCell';

/** @type {MuiSx} */
const scheduleActionsCellStyles = () => ({
  // The Agents kebab without menu items (components/DataRowAction)
  menuIcon: ({ palette }) => ({
    '& svg': { fontSize: '1rem' },
    'svg, &:hover svg': { fill: palette.icon.disabled },
  }),
});

export default ScheduleActionsCell;
