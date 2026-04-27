export const alitaToggleButtonStyle = theme => ({
  padding: '8px 8px',
  height: '28px',
  border: 'none',
  color: theme.palette.text.primary,
  background: theme.palette.background.tabButton.default,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: '0px',
  fontFamily: theme.typography.fontFamily,
  fontFeatureSettings: theme.typography.fontFeatureSettings,
  ...theme.typography.labelSmall,
  textTransform: 'none',
  '&:active': {
    color: theme.palette.text.secondary,
    background: theme.palette.background.button.secondary.pressed,
    backgroundColor: `${theme.palette.background.button.secondary.pressed} !important`,
  },
  '&.Mui-selected': {
    color: theme.palette.text.secondary,
    background: theme.palette.background.tabButton.active,
  },
  '& svg': {
    fontSize: '1rem',
  },
});
