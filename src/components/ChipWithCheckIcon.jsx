import { memo } from 'react';

import Chip from '@mui/material/Chip';

import CheckedIcon from '@/assets/checked-icon.svg?react';

const ChipWithCheckIcon = memo(
  ({ isSelected, label, icon, clickable = true, onClick, sx = {}, warning = false }) => {
    return (
      <Chip
        clickable={clickable}
        // disableRipple
        sx={[styles.chipLabel(warning, isSelected, !clickable), sx]}
        icon={icon || (isSelected ? <CheckedIcon /> : undefined)}
        label={label}
        onClick={clickable ? onClick : undefined}
      />
    );
  },
);

const styles = {
  chipLabel:
    (warning, isSelected, disabled) =>
    ({ palette }) => ({
      gap: '8px',
      borderRadius: '10px',
      px: '16px',
      py: '8px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      color: !disabled ? palette.text.secondary : palette.text.disabled,
      background: warning
        ? palette.background.warningBkg
        : isSelected
          ? palette.split.pressed
          : palette.background.userInputBackground,
      border: warning ? `1px solid ${palette.warning.main}` : undefined,
      '& .MuiChip-icon': {
        color: !disabled ? palette.text.secondary : palette.text.disabled,
      },
    }),
};

ChipWithCheckIcon.displayName = 'ChipWithCheckIcon';

export default ChipWithCheckIcon;
