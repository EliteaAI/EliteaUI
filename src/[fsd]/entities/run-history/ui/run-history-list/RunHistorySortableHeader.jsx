import { memo } from 'react';

import { Box } from '@mui/material';

import { Text } from '@/[fsd]/shared/ui';
import SortArrows from '@/assets/sort_arrows.svg?react';

const RunHistorySortableHeader = memo(props => {
  const { headerItems, sortConfig, onSort, gridTemplateColumns } = props;

  const styles = runHistorySortableHeaderStyles(gridTemplateColumns);

  return (
    <Box
      data-testid="run-history-header"
      sx={styles.header}
    >
      {headerItems.map((headerItem, index) => (
        <Box
          key={`header-${index}`}
          onClick={headerItem.sortable === false ? undefined : () => onSort(headerItem.type)}
          sx={[
            styles.sortableHeader(sortConfig.type === headerItem.type, sortConfig.direction === 'desc'),
            headerItem.sortable === false && styles.plainHeader,
          ]}
        >
          {headerItem.sortable !== false && <SortArrows />}
          {/* A cut label shows in full in the shared tooltip */}
          <Text.EllipsisTypography
            variant="labelMedium"
            color="text.secondary"
            sx={styles.label}
          >
            {headerItem.label}
          </Text.EllipsisTypography>
        </Box>
      ))}
    </Box>
  );
});

RunHistorySortableHeader.displayName = 'RunHistorySortableHeader';

/** @type {MuiSx} */
const runHistorySortableHeaderStyles = gridTemplateColumns => ({
  header: ({ palette }) => ({
    position: 'sticky',
    top: 0,
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: gridTemplateColumns || '1fr 1fr',
    alignItems: 'center',
    width: '100%',
    backgroundColor: palette.background.surface.interactive.default,
    border: '0.0625rem solid ' + palette.border.lines,
    // 1 px border + 15 px padding = the 16 px row padding, so header and value columns start at the same x
    padding: '0 0.9375rem',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    marginBottom: '.5rem',

    div: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: '0.5rem',
      cursor: 'pointer',
      margin: '.375rem 0rem',
      padding: '0 1rem',
      // A grid cell may narrow below its label, so the label can show its ellipsis
      minWidth: 0,
      overflow: 'hidden',
      borderRight: '.0625rem solid ' + palette.divider,

      span: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      },
      // The label fills the rest of its cell, so its ellipsis shows when the text is longer than the cell
      '& > div': {
        display: 'block',
        flex: '1 1 0',
        minWidth: 0,
        maxWidth: '100%',
      },

      ':last-of-type': { borderRight: 'none' },
    },
  }),
  label: {
    minWidth: 0,
    flex: '1 1 auto',
  },
  sortableHeader: (isActive, isDescending) => ({
    opacity: isActive ? 1 : 0.7,

    '& svg': {
      transform: isActive && isDescending ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    },
  }),
  // An extra column has no sort, so no pointer; its colour matches the other headers (the same 0.7 opacity
  // as an inactive sortable header)
  plainHeader: {
    // '&&' beats the header's `div` rule, which sets the pointer on every cell
    '&&': { cursor: 'default' },
  },
});

export default RunHistorySortableHeader;
