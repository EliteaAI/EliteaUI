// Card + flex-table layout shared by the Overview tables (ModelUsageTable, AutomatedActivityTable)
/** @type {MuiSx} */
export const analyticsTableStyles = {
  colorDot: color => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  }),
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  chartTitle: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  chartSubtitle: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    fontSize: '0.6875rem',
  }),
  subtitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.5rem',
  },
  tableWrapper: { display: 'flex', flexDirection: 'column', width: '100%', overflow: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
  }),
  tableCell: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.metrics || palette.text.disabled,
    textTransform: 'uppercase',
  }),
  tableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
};
