/** @type {MuiSx} */
export const projectConfigCardStyles = {
  card: ({ palette }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    gap: '1rem',
  }),
  // The text grows much faster than the dropdown, so on one line the dropdown stays at its
  // 15rem basis; once the card is too narrow it wraps below and stretches to full width.
  text: {
    flex: '999 1 20rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
  select: ({ typography }) => ({
    flex: '1 1 15rem',
    '& .MuiSelect-select': { ...typography.labelMedium },
  }),
};
