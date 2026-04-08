import { memo, useCallback, useMemo, useState } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

import { SortOrderOptions } from '@/common/constants.js';
import { stableSort } from '@/common/utils.jsx';
import SortDisabledIcon from '@/components/Icons/SortDisabledIcon.jsx';
import SortUpwardIcon from '@/components/Icons/SortUpwardIcon.jsx';

const VALUE_TYPES = {
  STRING: 'string',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  NULL_UNDEFINED: 'null_undefined',
};

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
        {/* Expand/Collapse Icon */}
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

        {/* Api Endpoint Name */}
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

      {/* Expanded Details Row */}
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

const OpenAPIActionsTable = memo(props => {
  const {
    tools = [],
    // Legacy prop support - if selected_tools is passed instead of tools
    selected_tools,
  } = props;

  // Support both new 'tools' prop and legacy 'selected_tools' prop
  const availableToolsSource = useMemo(
    () => (tools.length > 0 ? tools : selected_tools || []),
    [tools, selected_tools],
  );

  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState(SortOrderOptions.ASC);
  const [showMore, setShowMore] = useState(false);

  const styles = openAPIActionsTableStyles();

  const onClickShowMore = useCallback(() => {
    setShowMore(prev => !prev);
  }, []);

  const createNumericComparison = valueToNumber => {
    return (first, second, orderSorting) => {
      const firstNum = valueToNumber(first);
      const secondNum = valueToNumber(second);
      const comparison = firstNum - secondNum;
      return orderSorting === SortOrderOptions.ASC ? comparison : -1 * comparison;
    };
  };

  const comparisonStrategies = useMemo(
    () => ({
      [`${VALUE_TYPES.STRING}_${VALUE_TYPES.STRING}`]: (first, second, orderSorting) => {
        const comparison = first.toLowerCase().localeCompare(second.toLowerCase());
        return orderSorting === SortOrderOptions.ASC ? comparison : -1 * comparison;
      },

      [`${VALUE_TYPES.STRING}_${VALUE_TYPES.BOOLEAN}`]: (_first, _second, orderSorting) =>
        orderSorting === SortOrderOptions.ASC ? -1 : 1,
      [`${VALUE_TYPES.STRING}_${VALUE_TYPES.NUMBER}`]: (_first, _second, orderSorting) =>
        orderSorting === SortOrderOptions.ASC ? -1 : 1,
      [`${VALUE_TYPES.STRING}_${VALUE_TYPES.NULL_UNDEFINED}`]: (_first, _second, orderSorting) =>
        orderSorting === SortOrderOptions.ASC ? -1 : 1,

      [`${VALUE_TYPES.BOOLEAN}_${VALUE_TYPES.STRING}`]: (_first, _second, orderSorting) =>
        orderSorting === SortOrderOptions.ASC ? 1 : -1,
      [`${VALUE_TYPES.NUMBER}_${VALUE_TYPES.STRING}`]: (_first, _second, orderSorting) =>
        orderSorting === SortOrderOptions.ASC ? 1 : -1,
      [`${VALUE_TYPES.NULL_UNDEFINED}_${VALUE_TYPES.STRING}`]: (_first, _second, orderSorting) =>
        orderSorting === SortOrderOptions.ASC ? 1 : -1,

      [`${VALUE_TYPES.BOOLEAN}_${VALUE_TYPES.BOOLEAN}`]: createNumericComparison(value => (value ? 1 : 0)),
      default: createNumericComparison(value => value ?? 0),
    }),
    [],
  );

  const getValueType = useCallback(value => {
    if (typeof value === 'string') return VALUE_TYPES.STRING;
    if (typeof value === 'boolean') return VALUE_TYPES.BOOLEAN;
    if (typeof value === 'number') return VALUE_TYPES.NUMBER;
    return VALUE_TYPES.NULL_UNDEFINED;
  }, []);

  const getTypeKey = useCallback((firstType, secondType) => `${firstType}_${secondType}`, []);

  const compareValues = useCallback(
    (firstValue, secondValue, orderSorting) => {
      const firstType = getValueType(firstValue);
      const secondType = getValueType(secondValue);
      const typeKey = getTypeKey(firstType, secondType);

      const strategy = comparisonStrategies[typeKey] || comparisonStrategies.default;
      return strategy(firstValue, secondValue, orderSorting);
    },
    [getValueType, getTypeKey, comparisonStrategies],
  );

  const sortedActions = useMemo(() => {
    if (orderBy) {
      return stableSort(availableToolsSource, (first, second) => {
        const firstValue = first[orderBy];
        const secondValue = second[orderBy];

        return compareValues(firstValue, secondValue, order);
      });
    } else {
      return availableToolsSource;
    }
  }, [order, orderBy, availableToolsSource, compareValues]);

  const onClickSortLabel = useCallback(
    fieldName => () => {
      if (fieldName !== orderBy) {
        setOrderBy(fieldName);
        setOrder(SortOrderOptions.ASC);
      } else {
        if (order === SortOrderOptions.ASC) {
          setOrder(SortOrderOptions.DESC);
        } else {
          setOrder(SortOrderOptions.ASC);
        }
      }
    },
    [order, orderBy],
  );

  if (!availableToolsSource.length) {
    return null;
  }

  return (
    <>
      <TableContainer
        component={Paper}
        sx={styles.tableContainer}
      >
        <Table
          stickyHeader
          aria-label="tools actions table"
          size="small"
        >
          <TableHead>
            <TableRow>
              {/* Method column */}
              <TableCell
                sx={styles.headCell}
                align="left"
              >
                <TableSortLabel
                  sx={styles.sortLabel}
                  active={true}
                  direction={orderBy === 'method' ? order : SortOrderOptions.DESC}
                  onClick={onClickSortLabel('method')}
                  IconComponent={orderBy === 'method' ? SortUpwardIcon : SortDisabledIcon}
                >
                  <Typography variant="labelSmall">Method</Typography>
                </TableSortLabel>
              </TableCell>

              {/* Api Endpoint column */}
              <TableCell
                sx={styles.headCell}
                align="left"
              >
                <TableSortLabel
                  sx={styles.sortLabel}
                  active={true}
                  direction={orderBy === 'name' ? order : SortOrderOptions.DESC}
                  onClick={onClickSortLabel('name')}
                  IconComponent={orderBy === 'name' ? SortUpwardIcon : SortDisabledIcon}
                >
                  <Typography variant="labelSmall">Api Endpoint</Typography>
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(sortedActions.length <= 5 || showMore ? sortedActions : sortedActions.slice(0, 5)).map(
              (action, idx) => (
                <ToolRow
                  key={action.name || idx}
                  action={action}
                />
              ),
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {sortedActions.length > 5 && (
        <Box
          sx={styles.showMore}
          onClick={onClickShowMore}
        >
          <Typography
            variant="bodySmall"
            color="text.button.showMore"
          >
            {showMore ? 'Show less' : 'Show more'}
          </Typography>
        </Box>
      )}
    </>
  );
});

OpenAPIActionsTable.displayName = 'OpenAPIActionsTable';

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

/** @type {MuiSx} */
const openAPIActionsTableStyles = () => ({
  tableContainer: ({ palette }) => ({
    backgroundColor: palette.background.default,
    boxShadow: 'none',
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.25rem',
  }),
  headCell: ({ palette }) => ({
    padding: '0.375rem 0.25rem !important',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.default,
  }),
  sortLabel: {
    flexDirection: 'row-reverse',
  },
  showMore: {
    marginTop: '0.625rem',
    cursor: 'pointer',
  },
});

export default OpenAPIActionsTable;
