/** @type {MuiSx} */
const scheduleFormStyles = {
  root: { order: 1, width: '100%', margin: '0.75rem auto 0', padding: '0 1.5rem', maxWidth: '40.1875rem' },
  // StyledTabs pads its content by 1.5rem; the header bars of both columns run to the edges, so the grid cancels it
  split: { margin: '0 -1.5rem', width: 'calc(100% + 3rem)', padding: 0 },
  sidePanel: ({ palette }) => ({
    order: 2,
    minHeight: '100%',
    borderLeft: `0.0625rem solid ${palette.border.lines}`,
  }),
  // Below lg the panel is stacked under the form; an urgent card goes above it, so it is seen first
  sidePanelFirst: ({ breakpoints }) => ({ order: -1, [breakpoints.up('lg')]: { order: 2 } }),
  noTabIndicator: { '& .MuiTabs-indicator': { display: 'none' } },
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
  panel: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  // A fieldset, so `disabled` reaches every input inside; its default border, margin and min width are reset
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: 0,
    margin: 0,
    padding: '0 0 1.5rem',
    minWidth: 0,
  },
};

export default scheduleFormStyles;
