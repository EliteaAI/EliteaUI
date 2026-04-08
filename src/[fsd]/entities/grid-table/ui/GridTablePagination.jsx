import { memo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';
import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';

const GridTablePagination = memo(props => {
  const {
    // Calculated values from usePagination
    totalRows = 0,
    isFirstPage,
    isLastPage,
    startRow,
    endRow,
    pageSizeSelectOptions,
    // Current state
    pageSize,
    // Handlers from usePagination
    handlePrevPage,
    handleNextPage,
    handlePageSizeChange,
    // Optional customization
    rowsPerPageLabel = 'Rows per page:',
  } = props;

  const styles = gridTablePaginationStyles();

  if (totalRows === 0) {
    return null;
  }

  return (
    <Box sx={styles.footer}>
      <Box sx={styles.paddingContent}>
        <Box sx={styles.left}>
          <Typography
            variant="bodyMedium"
            color="text.primary"
          >
            {rowsPerPageLabel}
          </Typography>
          <Box sx={styles.pageSizeSelect}>
            <SingleSelect
              value={pageSize}
              onValueChange={handlePageSizeChange}
              options={pageSizeSelectOptions}
              showBorder={false}
              sx={styles.pageSizeDropdown}
            />
          </Box>
        </Box>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.pageInfo}
        >
          {`${startRow} - ${endRow} of ${totalRows}`}
        </Typography>
        <Box sx={styles.right}>
          <IconButton
            onClick={handlePrevPage}
            sx={styles.paginationButton(isFirstPage)}
            size="small"
            disabled={isFirstPage}
          >
            <Box
              component={ArrowLeftIcon}
              sx={styles.arrowIcon(isFirstPage)}
            />
          </IconButton>
          <IconButton
            onClick={handleNextPage}
            sx={styles.paginationButton(isLastPage)}
            size="small"
            disabled={isLastPage}
          >
            <Box
              component={ArrowRightIcon}
              sx={styles.arrowIcon(isLastPage)}
            />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

GridTablePagination.displayName = 'GridTablePagination';

/** @type {MuiSx} */
const gridTablePaginationStyles = () => ({
  footer: ({ palette }) => ({
    display: 'flex',
    paddingTop: '1rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  paddingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.625rem',
    paddingLeft: '1rem',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pageSizeSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pageSizeDropdown: {
    minWidth: '1.75rem',
    '& .MuiSelect-select': {
      padding: '0.25rem 1.25rem 0.25rem 0.25rem',
      display: 'flex',
      alignItems: 'center',
    },
    '&& .MuiSelect-icon': {
      top: '50% !important',
      transform: 'translateY(-50%)',
    },
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  pageInfo: {
    minWidth: '4.5rem',
    textAlign: 'center',
  },
  paginationButton: isDisabled => ({
    padding: '0.375rem',
    minWidth: 0,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    transition: 'opacity 0.2s ease',
    '&:hover': {
      backgroundColor: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    },
  }),
  arrowIcon:
    isDisabled =>
    ({ palette }) => ({
      fontSize: '1rem',
      fill: isDisabled ? palette.icon.fill.disabled : palette.icon.fill.default,
      color: isDisabled ? palette.icon.fill.disabled : palette.icon.fill.default,
      transition: 'fill 0.2s ease, color 0.2s ease',
    }),
});

export default GridTablePagination;
