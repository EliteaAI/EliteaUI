import { useCallback, useState } from 'react';

import { Box, TableCell, TableRow, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { PinButton } from '@/[fsd]/widgets/PinToggler/ui';
import PublishIcon from '@/assets/publish-version.svg?react';
import { isApplicationCard } from '@/common/checkCardType';
import { SortFields } from '@/common/constants';
import { getEntityTypeByCardType } from '@/common/utils';
import AuthorContainer from '@/components/AuthorContainer';
import DataRowAction from '@/components/DataRowAction';
import { IconLinkWithToolTip } from '@/components/Fork/IconLinkWithToolTip.jsx';
import HighlightQuery from '@/components/HighlightQuery';
import Like from '@/components/Like';
import useCardNavigate from '@/hooks/useCardNavigate';
import useDataViewMode from '@/hooks/useDataViewMode';

const DataTableRow = props => {
  const styles = dataTableRowStyles();
  const { columns, data: row, cardType, viewMode, onPinChange } = props;

  const { id, name, is_forked: isForked, meta, status, is_pinned: isPinned = false } = row;
  const dataViewMode = useDataViewMode(viewMode, row);
  const doNavigate = useCardNavigate({
    viewMode: dataViewMode,
    id,
    type: row.cardType || cardType,
    name,
  });

  const [isRowHovered, setIsRowHovered] = useState(false);

  const handlePinneChange = useCallback(
    newState => {
      onPinChange?.(id, newState);
      setIsRowHovered(false);
    },
    [onPinChange, id],
  );

  const renderCell = column => {
    const value = row[column.id];
    if (column.format) return column.format(value, row);
    if (column.id === 'name') {
      return (
        <StyledTooltip
          key={`name-tooltip-${isPinned ? 'p' : 'u'}-${id}`}
          placement="top"
          enterDelay={1000}
          enterNextDelay={1000}
          title={
            <>
              <Typography sx={styles.tooltipTitle}>{row.name || ''}</Typography>
              <Typography sx={styles.tooltipDescription}>{row.description || ''}</Typography>
            </>
          }
        >
          <Box sx={styles.nameContainer}>
            <Box sx={styles.textContainer}>
              <Typography
                variant="headingSmall"
                component="div"
                sx={styles.nameText}
              >
                <HighlightQuery
                  color="text.secondary"
                  text={row.name}
                  variant="headingSmall"
                />
              </Typography>
              <Typography
                variant="bodySmall"
                component="div"
                sx={styles.descriptionText}
              >
                <HighlightQuery
                  color="text.primary"
                  text={row.description}
                  variant="bodySmall"
                />
              </Typography>
            </Box>
            {status === 'published' && isApplicationCard(cardType) && (
              <StyledTooltip
                placement="top"
                title="Published"
              >
                <Box
                  sx={({ palette }) => ({
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',

                    svg: { path: { fill: `${palette.icon.fill.success} !important` } },
                  })}
                >
                  <PublishIcon sx={{ fontSize: '1rem' }} />
                </Box>
              </StyledTooltip>
            )}
            <PinButton
              entityId={id}
              entityType={cardType}
              initialPinned={isPinned}
              alwaysVisible={isRowHovered}
              onPinChange={handlePinneChange}
            />
          </Box>
        </StyledTooltip>
      );
    }
    if (column.id === SortFields.Authors) {
      const renderAuthorContainer = () => {
        if (row.authors) {
          return <AuthorContainer authors={row.authors} />;
        } else if (row.author) {
          return <AuthorContainer authors={[row.author]} />;
        }
      };

      return (
        <Box sx={styles.authorsContainer}>
          {renderAuthorContainer()}
          {isForked && (
            <IconLinkWithToolTip
              tooltip={name}
              meta={meta}
              type={getEntityTypeByCardType(cardType)}
            />
          )}
        </Box>
      );
    }
    if (column.id === SortFields.Likes) {
      return (
        <Like
          viewMode={dataViewMode}
          type={cardType}
          data={row}
        />
      );
    }
    if (column.id === 'actions') {
      return (
        <DataRowAction
          viewMode={dataViewMode}
          data={row}
          type={cardType}
        />
      );
    }
    return value;
  };
  return (
    <TableRow
      hover
      role="checkbox"
      tabIndex={-1}
      key={row?.id}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      {columns.map(column => {
        const isNameColumn = column.id === 'name';
        return (
          <TableCell
            key={column.id}
            align={column.align}
            onClick={isNameColumn ? doNavigate : undefined}
            sx={styles.tableCell(isNameColumn, column?.rowCellPadding)}
          >
            {renderCell(column)}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

DataTableRow.displayName = 'DataTableRow';

/** @type {MuiSx} */
const dataTableRowStyles = () => ({
  tableCell:
    (isNameColumn, customPadding) =>
    ({ palette }) => ({
      padding: customPadding || '0.375rem 1.5rem',
      borderBottom: `0.0625rem solid ${palette.border.table}`,
      cursor: isNameColumn ? 'pointer' : 'default',
    }),
  tooltipTitle: {
    fontWeight: 700,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '2',
    whiteSpaceCollapse: 'preserve',
  },
  tooltipDescription: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '4',
    whiteSpaceCollapse: 'preserve',
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
    width: '100%',
  },
  textContainer: {
    overflow: 'hidden',
    flex: 1,
  },
  nameText: {
    maxWidth: '100%',
    overflow: 'hidden',
    wordWrap: 'break-word',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
  },
  descriptionText: {
    maxWidth: '100%',
    overflow: 'hidden',
    wordWrap: 'break-word',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  authorsContainer: {
    display: 'flex',
    maxWidth: '9.75rem',
    width: '9.75rem',
  },
});

export default DataTableRow;
