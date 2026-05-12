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
    color: palette.split.text.default,
    background: palette.split.default,
    '& .MuiButton-startIcon svg, & .MuiButton-startIcon path': {
      fill: palette.text.createButton,
    },
    '&:hover': {
      background: palette.split.hover,
    },
    '&:active': {
      color: palette.split.text.pressed,
      backgroundColor: palette.split.pressed,
    },
    '&.Mui-disabled': {
      color: palette.split.text.disabled,
      backgroundColor: palette.split.disabled,
      '& .MuiButton-startIcon svg, & .MuiButton-startIcon path': {
        fill: palette.text.disabled,
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
