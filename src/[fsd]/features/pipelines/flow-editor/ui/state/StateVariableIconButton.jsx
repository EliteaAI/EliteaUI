import { memo } from 'react';

import { IconButton, Tooltip } from '@mui/material';

const StateVariableIconButton = memo(props => {
  const { children, tooltip, onClick, isActive = false, disabled = false, sx = {} } = props;

  const styles = iconButtonStyles(isActive);

  return (
    <Tooltip
      title={disabled ? '' : tooltip}
      placement="top"
    >
      <IconButton
        variant="elitea"
        onClick={onClick}
        disabled={disabled}
        sx={[styles.button, sx]}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
});

StateVariableIconButton.displayName = 'StateVariableIconButton';

export default StateVariableIconButton;

/** @type {MuiSx} */
const iconButtonStyles = isActive => ({
  button: ({ palette }) => ({
    borderRadius: '0.5rem',
    height: '2rem',
    width: '2rem',
    backgroundColor: `${palette.background.userInputBackground} !important`,
    border: isActive
      ? `0.0625rem solid ${palette.primary.pressed} !important`
      : '0.0625rem solid transparent !important',
    '&:hover:not(:disabled)': {
      borderColor: `${isActive ? palette.primary.pressed : palette.border.lines} !important`,
      backgroundColor: `${palette.background.userInputBackground} !important`,
    },
    '&:focus, &:focus-visible': {
      borderColor: `${palette.primary.pressed} !important`,
      outline: 'none',
      backgroundColor: `${palette.background.userInputBackground} !important`,
    },
    '&.Mui-focusVisible': {
      backgroundColor: `${palette.background.userInputBackground} !important`,
    },
    '& .MuiTouchRipple-root': {
      display: 'none',
    },
    '&:disabled': {
      border: '0.0625rem solid transparent !important',
      '& svg': {
        color: palette.icon.fill.disabled,
      },
    },
  }),
});
