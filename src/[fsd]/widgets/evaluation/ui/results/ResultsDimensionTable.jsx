import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { EVAL_ENGINE } from '../../lib/constants';
import { formatScore, getBindingEngineLabel } from '../../lib/helpers';

const COLUMNS = [
  { key: 'dimension', label: 'Dimension' },
  { key: 'scale', label: 'Scale' },
  { key: 'avg', label: 'Avg' },
  { key: 'target', label: 'Target' },
  { key: 'met', label: 'Met' },
];

const GRID_TEMPLATE = '1fr 0.5fr 5rem 5rem 5rem';

const formatTarget = binding => {
  if (binding.target == null || binding.target === '' || !binding.operator) return '—';
  const op = binding.operator === '>=' ? '≥' : binding.operator;
  return `${op}${binding.target}`;
};

const formatMet = binding => {
  if (!binding.targetedCount) return '—';
  return `${binding.metCount}/${binding.targetedCount}`;
};

const ResultsDimensionTable = memo(props => {
  const { bindings = [] } = props;

  const styles = resultsDimensionTableStyles();

  if (bindings.length === 0) {
    return null;
  }

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-results-dimension-table"
    >
      <Box sx={styles.header}>
        {COLUMNS.map((col, index) => (
          <Box
            key={col.key}
            sx={styles.headerCell(index === 0)}
          >
            <Typography
              variant="labelMedium"
              sx={styles.headerText}
            >
              {col.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={styles.body}>
        {bindings.map(binding => {
          const engineLabel = getBindingEngineLabel(binding);
          const isPending = binding.engine === EVAL_ENGINE.human && binding.scored === 0;

          return (
            <Box
              key={binding.key}
              sx={styles.row}
              data-testid={`dimension-row-${binding.key}`}
            >
              <Box sx={styles.cell}>
                <Typography
                  variant="bodySmall"
                  sx={styles.dimensionName}
                >
                  {binding.name}
                </Typography>
                <Box sx={styles.engineBadge}>
                  <Typography
                    variant="bodySmall"
                    sx={styles.engineText}
                  >
                    {engineLabel}
                  </Typography>
                </Box>
              </Box>
              <Box sx={styles.cell}>
                <Typography
                  variant="bodySmall"
                  sx={styles.cellText}
                >
                  {binding.scaleType || '—'}
                </Typography>
              </Box>
              <Box sx={styles.cell}>
                <Typography
                  variant="bodySmall"
                  sx={styles.cellText}
                >
                  {isPending ? '—' : formatScore(binding.avgNative)}
                </Typography>
              </Box>
              <Box sx={styles.cell}>
                <Typography
                  variant="bodySmall"
                  sx={styles.cellText}
                >
                  {formatTarget(binding)}
                </Typography>
              </Box>
              <Box sx={styles.cell}>
                <Typography
                  variant="bodySmall"
                  sx={styles.cellText}
                >
                  {isPending ? '—' : formatMet(binding)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

ResultsDimensionTable.displayName = 'ResultsDimensionTable';

/** @type {MuiSx} */
const resultsDimensionTableStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5rem',
  },
  header: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE,
    alignItems: 'center',
    height: '2.25rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  headerCell: isFirst => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    height: '100%',
    ...(isFirst && {
      borderTopLeftRadius: '0.5rem',
      borderBottomLeftRadius: '0.5rem',
    }),
  }),
  headerText: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
  }),
  body: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: GRID_TEMPLATE,
    alignItems: 'center',
    minHeight: '3.5rem',
    borderBottom: `0.0625rem solid ${palette.background.dataGrid.main}`,
  }),
  cell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
  },
  dimensionName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    fontSize: '.875rem',
  }),
  engineBadge: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.125rem 0.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.background.dataGrid.main}`,
    backgroundColor: 'transparent',
  }),
  engineText: ({ palette }) => ({
    color: palette.text.default,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  }),
  cellText: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 400,
    fontSize: '.875rem',
    textTransform: 'capitalize',
  }),
});

export default ResultsDimensionTable;
