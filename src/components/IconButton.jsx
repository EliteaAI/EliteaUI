import { iconButtonClasses } from '@mui/material/IconButton';

export const eliteaIconButtonStyle = (theme, color) => ({
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
    color: theme.palette.components.button.text.primary,
    background: `${theme.palette.components.button.background.primary.default} !important`,
    '&:hover': {
      background: theme.palette.components.button.background.primary.hover,
      backgroundColor: `${theme.palette.components.button.background.primary.hover} !important`,
    },
    '&:active': {
      background: theme.palette.components.button.background.primary.pressed,
      backgroundColor: `${theme.palette.components.button.background.primary.pressed} !important`,
    },
    '&:disabled': {
      color: theme.palette.components.button.text.primary,
      background: theme.palette.components.button.background.primary.disabled,
      backgroundColor: `${theme.palette.components.button.background.primary.disabled} !important`,
    },
  },
  ['&.' + iconButtonClasses.colorSecondary]: {
    color: theme.palette.text.secondary,
    '& .MuiSvgIcon-root path': {
      fill: theme.palette.icon.secondary,
    },
    background: theme.palette.components.button.background.secondary.default,
    backgroundColor: `${theme.palette.components.button.background.secondary.default} !important`,
    '&:hover': {
      background: theme.palette.components.button.background.secondary.hover,
      backgroundColor: `${theme.palette.components.button.background.secondary.hover} !important`,
    },
    '&:active': {
      color: theme.palette.text.primary,
      background: theme.palette.components.button.background.secondary.pressed,
      backgroundColor: `${theme.palette.components.button.background.secondary.pressed} !important`,
      border: `1px solid ${theme.palette.border.lines}`,
    },
    '&:disabled': {
      color: theme.palette.components.button.text.disabled,
      background: theme.palette.components.button.background.default,
      backgroundColor: `${theme.palette.components.button.background.default} !important`,
      '& .MuiSvgIcon-root path': {
        fill: theme.palette.icon.disabled,
      },
    },
  },
  ...(color === 'tertiary'
    ? {
        color: theme.palette.text.primary,
        background: 'transparent',
        minWidth: '28px !important',
        height: '28px',
        borderRadius: '16px',
        padding: '6px',
        '& .MuiSvgIcon-root path': {
          fill: theme.palette.icon.default,
        },
        '&:hover': {
          background: theme.palette.components.button.background.secondary.default,
          color: theme.palette.text.secondary,
          '& .MuiSvgIcon-root path': {
            fill: theme.palette.icon.secondary,
          },
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.components.button.background.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.disabled,
          '& .MuiSvgIcon-root path': {
            fill: theme.palette.icon.disabled,
          },
          background: 'transparent',
        },
      }
    : {}),
  ...(color === 'tertiaryCount'
    ? {
        color: theme.palette.text.primary,
        background: 'transparent',
        minWidth: '49px !important',
        height: '28px',
        borderRadius: '16px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px !important',
        '&:hover': {
          background: theme.palette.components.button.background.secondary.default,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.components.button.background.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.disabled,
          background: 'transparent',
        },
      }
    : {}),
  ...(color === 'alarm'
    ? {
        color: theme.palette.text.secondary,
        background: theme.palette.components.button.background.alarm.default,
        minWidth: '28px !important',
        height: '28px',
        borderRadius: '16px',
        padding: '6px',
        gap: '10px',
        '&:hover': {
          background: theme.palette.components.button.background.secondary.default,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.components.button.background.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.primary,
          background: theme.palette.components.button.background.alarm.disabled,
        },
      }
    : {}),
  ...(color === 'magicAssistant'
    ? {
        background: theme.palette.components.button.background.magicAssistant,
        minWidth: '28px !important',
        height: '28px',
        borderRadius: '16px',
        padding: '6px',
        gap: '10px',
        '&:hover': {
          background: theme.palette.components.button.background.magicAssistant,
        },
        '&:active': {
          background: theme.palette.components.button.background.magicAssistant,
        },
        '&:disabled': {
          background: theme.palette.components.button.background.magicAssistant,
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
          background: theme.palette.components.button.background.secondary.pressed,
          border: `1px solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.primary,
          background: theme.palette.components.button.background.alarm.disabled,
        },
      }
    : {}),
});
