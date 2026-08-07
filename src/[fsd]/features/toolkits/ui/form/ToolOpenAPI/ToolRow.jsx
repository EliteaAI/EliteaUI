import { memo, useCallback, useState } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Box, Collapse, IconButton, TableCell, TableRow, Typography } from '@mui/material';

const ToolRow = memo(props => {
  const { action } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = toolRowStyles();

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <>
      <TableRow
        sx={styles.row(isExpanded)}
        onClick={handleToggleExpand}
      >
        <TableCell
          sx={styles.methodCell}
          align="left"
        >
          <Box sx={styles.methodCellContent}>
            <IconButton
              size="small"
              sx={styles.expandButton}
              onClick={e => {
                e.stopPropagation();
                handleToggleExpand();
              }}
            >
              {isExpanded ? (
                <KeyboardArrowDownIcon fontSize="small" />
              ) : (
                <KeyboardArrowRightIcon fontSize="small" />
              )}
            </IconButton>
            <Typography
              component="div"
              sx={styles.methodText}
              variant="bodySmall"
            >
              {action.method}
            </Typography>
          </Box>
        </TableCell>

        <TableCell
          sx={styles.bodyCell}
          align="left"
        >
          <Typography
            component="div"
            sx={styles.text}
            variant="bodySmall"
          >
            {action.name}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell
          sx={styles.detailsCell(isExpanded)}
          colSpan={3}
        >
          <Collapse
            in={isExpanded}
            timeout="auto"
            unmountOnExit
          >
            <Box sx={styles.detailsContent}>
              {action.description && (
                <Box sx={styles.detailItem}>
                  <Typography
                    variant="labelSmall"
                    sx={styles.detailLabel}
                  >
                    Description:
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.detailValue}
                  >
                    {action.description}
                  </Typography>
                </Box>
              )}
              {action.path && (
                <Box sx={styles.detailItem}>
                  <Typography
                    variant="labelSmall"
                    sx={styles.detailLabel}
                  >
                    Path:
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.detailValue}
                  >
                    {action.path}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

ToolRow.displayName = 'ToolRow';

/** @type {MuiSx} */
const toolRowStyles = () => ({
  row:
    isExpanded =>
    ({ palette }) => ({
      cursor: 'pointer',
      backgroundColor: isExpanded ? palette.background.secondaryBg : palette.background.default,
      '&:hover': {
        backgroundColor: palette.background.secondaryBg,
      },
    }),
  expandButton: ({ palette }) => ({
    padding: '0.125rem',
    color: palette.text.secondary,
  }),
  methodCellContent: {
    display: 'flex',
    alignItems: 'center',
  },
  bodyCell: ({ palette }) => ({
    padding: '0.375rem 0.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    color: palette.text.secondary,
    backgroundColor: palette.background.default,
  }),
  methodCell: ({ palette }) => ({
    padding: '0.375rem 0.5rem',
    width: '5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    color: palette.text.secondary,
    backgroundColor: palette.background.default,
  }),
  text: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  methodText: {
    textTransform: 'lowercase',
  },
  detailsCell: isExpanded => ({
    padding: 0,
    border: 'none',
    ...(isExpanded ? {} : { height: 0 }),
  }),
  detailsContent: ({ palette }) => ({
    padding: '0.5rem 0.5rem 0.75rem 2.5rem',
    backgroundColor: palette.background.secondaryBg,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '0.5rem',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  detailLabel: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.125rem',
  }),
  detailValue: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default ToolRow;
