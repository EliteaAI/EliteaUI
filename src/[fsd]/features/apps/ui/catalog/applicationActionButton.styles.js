/** @type {MuiSx} */
export const applicationActionButtonStyles = {
  actionButton: {
    height: '1.75rem',
    minWidth: 'auto',
    px: '0.75rem',
    py: 0,
    gap: '0.375rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    '& .MuiButton-startIcon': {
      margin: 0,
      width: '1rem',
      height: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
    },
    '& .MuiButton-startIcon svg': {
      display: 'block',
    },
  },
  createActionButton: ({ palette }) => ({
    color: palette.components.accentButton.text.primary,
    background: palette.components.accentButton.background.default,
    '& .MuiButton-startIcon svg, & .MuiButton-startIcon path': {
      fill: palette.icon.accent,
    },
    '&:hover': {
      background: palette.components.accentButton.background.hover,
    },
    '&:active': {
      color: palette.components.accentButton.text.pressed,
      backgroundColor: palette.components.accentButton.background.pressed,
    },
    '&.Mui-disabled': {
      color: palette.components.accentButton.text.disabled,
      backgroundColor: palette.components.accentButton.background.disabled,
      '& .MuiButton-startIcon svg, & .MuiButton-startIcon path': {
        fill: palette.icon.disabled,
      },
    },
  }),
  actionButtonLabel: {
    display: 'flex',
    alignItems: 'center',
    height: '1rem',
    lineHeight: '1rem',
  },
};
