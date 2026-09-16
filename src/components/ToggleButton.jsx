export const eliteaToggleButtonStyle = theme => ({
  padding: '8px 8px',
  height: '28px',
  border: 'none',
  color: theme.palette.text.primary,
  background: theme.palette.components.tabGroupButton.background.default,
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
    background: theme.palette.components.button.background.secondary.pressed,
    backgroundColor: `${theme.palette.components.button.background.secondary.pressed} !important`,
  },
  '&.Mui-selected': {
    color: theme.palette.text.secondary,
    background: theme.palette.components.tabGroupButton.background.active,
  },
  '& svg': {
    fontSize: '1rem',
  },
});
