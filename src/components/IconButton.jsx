import { iconButtonClasses } from '@mui/material/IconButton';

export const alitaIconButtonStyle = (theme, color) => ({
  display: 'flex',
  height: '28px',
  width: '28px',
  padding: '6px',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  borderRadius: '28px',
  // marginLeft: '8px',
  fontFamily: theme.typography.fontFamily,
  fontFeatureSettings: theme.typography.fontFeatureSettings,
  ...theme.typography.bodySmall,
  textTransform: 'none',
  ['&.' + iconButtonClasses.colorPrimary]: {
    color: theme.palette.text.button.primary,
    background: `${theme.palette.background.button.primary.default} !important`,
    '&:hover': {
      background: theme.palette.background.button.primary.hover,
      backgroundColor: `${theme.palette.background.button.primary.hover} !important`,
    },
    '&:active': {
      background: theme.palette.background.button.primary.pressed,
      backgroundColor: `${theme.palette.background.button.primary.pressed} !important`,
    },
    '&:disabled': {
      color: theme.palette.text.button.primary,
      background: theme.palette.background.button.primary.disabled,
      backgroundColor: `${theme.palette.background.button.primary.disabled} !important`,
    },
  },
  ['&.' + iconButtonClasses.colorSecondary]: {
    color: theme.palette.text.secondary,
    '& .MuiSvgIcon-root path': {
      fill: theme.palette.text.secondary,
    },
    background: theme.palette.background.button.secondary.default,
    backgroundColor: `${theme.palette.background.button.secondary.default} !important`,
    '&:hover': {
      background: theme.palette.background.button.secondary.hover,
      backgroundColor: `${theme.palette.background.button.secondary.hover} !important`,
    },
    '&:active': {
      color: theme.palette.text.primary,
      background: theme.palette.background.button.secondary.pressed,
      backgroundColor: `${theme.palette.background.button.secondary.pressed} !important`,
      border: `1px solid ${theme.palette.border.lines}`,
    },
    '&:disabled': {
      color: theme.palette.text.button.disabled,
      background: theme.palette.background.button.default,
      backgroundColor: `${theme.palette.background.button.default} !important`,
      '& .MuiSvgIcon-root path': {
        fill: theme.palette.icon.fill.disabled,
      },
    },
  },
  ...(color === 'tertiary'
    ? {
        color: theme.palette.text.default,
        background: 'transparent',
        minWidth: '28px !important',
        height: '28px',
        borderRadius: '16px',
        padding: '6px',
        '& .MuiSvgIcon-root path': {
          fill: theme.palette.icon.fill.default,
        },
        '&:hover': {
          background: theme.palette.background.button.secondary.default,
          color: theme.palette.text.secondary,
          '& .MuiSvgIcon-root path': {
            fill: theme.palette.icon.fill.secondary,
          },
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.text.button.disabled,
          '& .MuiSvgIcon-root path': {
            fill: theme.palette.icon.fill.disabled,
          },
          background: 'transparent',
        },
      }
    : {}),
  ...(color === 'tertiaryCount'
    ? {
        color: theme.palette.text.default,
        background: 'transparent',
        minWidth: '49px !important',
        height: '28px',
        borderRadius: '16px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px !important',
        '&:hover': {
          background: theme.palette.background.button.secondary.default,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.text.button.disabled,
          background: 'transparent',
        },
      }
    : {}),
  ...(color === 'alarm'
    ? {
        color: theme.palette.text.secondary,
        background: theme.palette.background.button.alarm.default,
        minWidth: '28px !important',
        height: '28px',
        borderRadius: '16px',
        padding: '6px',
        gap: '10px',
        '&:hover': {
          background: theme.palette.background.button.secondary.default,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.text.button.primary,
          background: theme.palette.background.button.alarm.disabled,
        },
      }
    : {}),
  ...(color === 'magicAssistant'
    ? {
        background: theme.palette.background.button.magicAssistant,
        minWidth: '28px !important',
        height: '28px',
        borderRadius: '16px',
        padding: '6px',
        gap: '10px',
        '&:hover': {
          background: theme.palette.background.button.magicAssistant,
        },
        '&:active': {
          background: theme.palette.background.button.magicAssistant,
        },
        '&:disabled': {
          background: theme.palette.background.button.magicAssistant,
        },
      }
    : {}),
  ...(color === 'delete'
    ? {
        color: theme.palette.text.secondary,
        background: theme.palette.secondary.main,
        width: '20px',
        minWidth: '20px !important',
        height: '20px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        marginLeft: '0px',
        '&:hover': {
          background: theme.palette.secondary.main,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.text.button.primary,
          background: theme.palette.background.button.alarm.disabled,
        },
      }
    : {}),
});
