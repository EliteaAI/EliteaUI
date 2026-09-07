export const catalogCardNewBadgeStyles = ({ palette }) => ({
  height: '1.125rem',
  fontSize: '0.625rem',
  fontWeight: 700,
  backgroundColor: palette.success.main,
  color: palette.success.contrastText,
  pointerEvents: 'none',
  zIndex: 1,
  '& .MuiChip-label': {
    padding: '0 0.375rem',
  },
});

export const catalogCardActionContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};
