/**
 * Shared shell styles for the evaluation list rows (library items, datasets, suite bindings).
 * They looked alike by coincidence before, and drifted: only the dataset row had a hover state.
 *
 * `clickable` marks a row whose whole surface navigates; `dense` is the tighter binding-row
 * padding with vertically centred content.
 *
 * @type {MuiSx}
 */
export const evaluationRowStyles = ({ clickable = false, dense = false } = {}) => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: dense ? 'center' : 'flex-start',
    justifyContent: 'space-between',
    gap: dense ? '0.5rem' : '0.75rem',
    padding: dense ? '0.375rem 0.75rem' : '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    ...(clickable ? { cursor: 'pointer' } : {}),
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  info: {
    display: 'flex',
    ...(dense ? { alignItems: 'center', flexWrap: 'wrap' } : { flexDirection: 'column' }),
    gap: dense ? '0.5rem' : '0.25rem',
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0,
  },
});
