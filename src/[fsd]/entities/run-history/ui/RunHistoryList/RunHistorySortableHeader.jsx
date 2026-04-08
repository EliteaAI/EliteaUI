import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import SortArrows from '@/assets/sort_arrows.svg?react';

const RunHistorySortableHeader = memo(props => {
  const { headerItems, sortConfig, onSort, gridTemplateColumns } = props;

  const styles = runHistorySortableHeaderStyles(gridTemplateColumns);

  return (
    <Box sx={styles.header}>
      {headerItems.map((headerItem, index) => (
        <Box
          key={`header-${index}`}
          onClick={() => onSort(headerItem.type)}
          sx={styles.sortableHeader(sortConfig.type === headerItem.type, sortConfig.direction === 'desc')}
        >
          <SortArrows />
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            {headerItem.label}
          </Typography>
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
    backgroundColor: palette.background.userInputBackground,
    border: '1px solid ' + palette.border.lines,
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
      borderRight: '.0625rem solid ' + palette.divider,

      span: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      },

      ':last-of-type': { borderRight: 'none' },
    },
  }),
  sortableHeader: (isActive, isDescending) => ({
    opacity: isActive ? 1 : 0.7,

    '& svg': {
      transform: isActive && isDescending ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    },
  }),
});

export default RunHistorySortableHeader;
