import { customScrollbarSx } from '@/[fsd]/shared/lib/helpers';

// Header and body rows are separate flex containers, so their columns only line up when every
// cell resolves to the same width in both. With a plain `flex: N` the minimum width is `auto`:
// header cells (visible overflow) refuse to shrink below their longest word plus the reserved
// sort icon, while body cells (overflow hidden) shrink freely. On narrow viewports that pushes
// the header columns to the right of the values below them. Giving header and body cells the
// same explicit minimum width removes the content dependency, and giving the rows the same
// minimum width makes the table scroll horizontally instead of squeezing the columns.
const COLUMN_UNIT_REM = 5;
// Wide (name) columns grow with their flex factor but do not need a proportionally wide minimum
const MAX_MIN_UNITS = 2;
const CELL_GAP_REM = 0.5;
const ROW_PADDING_X_REM = 0.75;

const toFlex = columnOrFlex => (typeof columnOrFlex === 'number' ? columnOrFlex : (columnOrFlex?.flex ?? 1));

const columnMinWidthRem = (flex, unitRem = COLUMN_UNIT_REM) => Math.min(flex, MAX_MIN_UNITS) * unitRem;

// Sizing for one header or body cell. Accepts a column definition (`{ flex }`) or a flex number.
// Pass the same `unitRem` here and to `analyticsRowMinWidthSx` for compact tables.
export const analyticsColumnSx = (columnOrFlex, options = {}) => {
  const { unitRem } = options;
  const flex = toFlex(columnOrFlex);
  return { flex: `${flex} 1 0`, minWidth: `${columnMinWidthRem(flex, unitRem)}rem` };
};

// Minimum width shared by the header row and every body row of one table.
// Pass `paddingXRem` / `gapRem` when the rows do not use the default analytics row spacing, and
// `fixedColumnsRem` (one width per column) for fixed-width columns that are not flex-sized.
export const analyticsRowMinWidthSx = (columnsOrFlexes, options = {}) => {
  const { gapRem = CELL_GAP_REM, paddingXRem = ROW_PADDING_X_REM, fixedColumnsRem = [], unitRem } = options;
  const flexes = columnsOrFlexes.map(toFlex);
  const cellsRem =
    flexes.reduce((sum, flex) => sum + columnMinWidthRem(flex, unitRem), 0) +
    fixedColumnsRem.reduce((sum, width) => sum + width, 0);
  const gapsRem = Math.max(flexes.length + fixedColumnsRem.length - 1, 0) * gapRem;
  return { minWidth: `${cellsRem + gapsRem + paddingXRem * 2}rem` };
};

// Scroll container for a table. The app hides every scrollbar globally, which leaves an overflowing
// table with no visible way to reach its hidden columns on a plain mouse wheel (Windows), so the
// table wrapper opts back in to the thin themed scrollbar.
export const analyticsTableWrapperSx = theme => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'auto',
  ...customScrollbarSx(theme),
});

// Header labels wrap inside their fixed-minimum cell instead of widening it
export const analyticsHeaderCellSx = { overflowWrap: 'anywhere' };

// Card + flex-table layout shared by the Overview tables (ModelUsageTable, AutomatedActivityTable)
export const analyticsTableSortLabelSx = {
  color: 'inherit',
  '&.Mui-active': { color: 'inherit' },
  '& .MuiTableSortLabel-icon': { fontSize: '0.875rem' },
};

// For right-aligned (numeric) columns. TableSortLabel always reserves room for its arrow after the
// label, even while the arrow is hidden, so a right-aligned header ends short of the values under
// it. Rendering the arrow before the label keeps the label text flush with the right edge.
export const analyticsTableSortLabelEndSx = {
  ...analyticsTableSortLabelSx,
  flexDirection: 'row-reverse',
  '& .MuiTableSortLabel-icon': { fontSize: '0.875rem', marginLeft: 0, marginRight: '0.25rem' },
};
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
  tableWrapper: analyticsTableWrapperSx,
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
