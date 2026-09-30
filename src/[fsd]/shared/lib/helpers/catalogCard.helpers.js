/** @type {MuiSx} */
export const catalogCardNewBadgeStyles = ({ palette }) => ({
  height: '1.5rem',
  marginLeft: 'auto',
  flexShrink: 0,
  fontSize: '0.75rem',
  fontWeight: 500,
  backgroundColor: palette.components.chip.background.positive,
  color: palette.text.secondary,
  pointerEvents: 'none',
  zIndex: 1,
});

/** @type {MuiSx} */
export const catalogCardActionContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};
