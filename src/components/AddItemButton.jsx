import { forwardRef } from 'react';

import { Button, Typography, useTheme } from '@mui/material';

import PlusIcon from './Icons/PlusIcon';

const AddItemButton = forwardRef(({ onClick, title = 'item', disabled, sx = {} }, ref) => {
  const theme = useTheme();
  return (
    <Button
      ref={ref}
      sx={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '6px 12px',
        gap: '6px',
        width: 'auto',
        height: '28px',
        border: `1px solid #3B3E46`, // DT/gray_30 (lines) from Figma
        borderRadius: '16px',
        background: 'transparent !important',
        color: theme.palette.text.secondary,
        fontFamily: 'Montserrat',
        textTransform: 'none',
        transition: 'all 0.2s ease-in-out',
        flex: 'none',
        order: 0,
        flexGrow: 0,
        '&:hover': {
          background: `${theme.palette.background.button.iconLabelButton.hover} !important`,
          borderColor: '#3B3E46', // Keep same border color on hover
        },
        '&:active': {
          background: theme.palette.background.button.iconLabelButton.selected,
          borderColor: '#3B3E46',
        },
        '&:disabled': {
          color: theme.palette.text.button.disabled,
          background: theme.palette.background.button.iconLabelButton.disabled,
          borderColor: '#3B3E46',
        },
        ...sx,
      }}
      variant="alita"
      color="secondary"
      disabled={disabled}
      onClick={onClick}
    >
      <PlusIcon
        style={{
          width: '12px',
          height: '12px',
          flexShrink: 0,
        }}
        fill={!disabled ? theme.palette.icon.fill.secondary : theme.palette.text.button.disabled}
      />
      <Typography
        variant="labelSmall"
        sx={{
          fontFamily: 'Montserrat',
          textTransform: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>
    </Button>
  );
});

AddItemButton.displayName = 'AddItemButton';

export default AddItemButton;
