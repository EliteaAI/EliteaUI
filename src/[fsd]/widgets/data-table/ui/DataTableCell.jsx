import { memo } from 'react';

import { Box } from '@mui/material';

import { LikeButton, useApplicationLike } from '@/[fsd]/entities/like';
import { SortFields } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import useDataViewMode from '@/hooks/useDataViewMode';

const DataTableCell = memo(props => {
  const { column, value, row, cardType, viewMode } = props;
  const dataViewMode = useDataViewMode(viewMode, row);
  const likeProps = useApplicationLike({ data: row, type: cardType, viewMode: dataViewMode });
  const styles = dataTableCellStyles();

  if (!column) return value ?? '-';
  if (column.format) return column.format(value, row);
  if (column.id === SortFields.Authors) {
    const renderAuthorContainer = () => {
      if (row.authors)
        return (
          <AuthorContainer
            disabledNavigation
            authors={row.authors}
          />
        );
      if (row.author)
        return (
          <AuthorContainer
            disabledNavigation
            authors={[row.author]}
          />
        );
      return null;
    };
    return <Box sx={styles.authorsContainer}>{renderAuthorContainer()}</Box>;
  }
  if (column.id === SortFields.Likes) {
    return <LikeButton {...likeProps} />;
  }
  return value ?? '-';
});
DataTableCell.displayName = 'DataTableCell';

/** @type {MuiSx} */
const dataTableCellStyles = () => ({
  authorsContainer: {
    display: 'flex',
    maxWidth: '9.75rem',
    width: '9.75rem',
  },
});

export default DataTableCell;
