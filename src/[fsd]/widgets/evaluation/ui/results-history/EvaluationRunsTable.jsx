import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { GridTableHeader } from '@/[fsd]/entities/grid-table/ui';

import { resolveRunSuiteName, resolveRunVersionName } from '../../lib/helpers';
import EvaluationRunRow from './EvaluationRunRow';

const COLUMNS = [
  { field: 'date', label: 'Date', sortable: true },
  { field: 'suite', label: 'Suite', sortable: true },
  { field: 'version', label: 'Version', sortable: true },
  { field: 'score', label: 'Score', sortable: true },
];

const GRID_TEMPLATE_COLUMNS = '1.15fr 1fr 0.8fr 1fr';

const EvaluationRunsTable = memo(props => {
  const {
    runs = [],
    suiteNamesById = {},
    versions = [],
    selectedRunId = null,
    isLoading = false,
    canDelete = false,
    exportingRunId = null,
    sortConfig,
    onSort,
    onSelect,
    onShare,
    onExport,
    onDelete,
  } = props;

  const styles = evaluationRunsTableStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-runs-table"
    >
      <GridTableHeader
        columns={COLUMNS}
        sortConfig={sortConfig}
        onSort={onSort}
        showCheckbox={false}
        gridTemplateColumns={GRID_TEMPLATE_COLUMNS}
        columnTestIdPrefix="evaluation-runs"
      />

      {isLoading ? (
        <Box sx={styles.stateContainer}>
          <CircularProgress size={24} />
        </Box>
      ) : runs.length === 0 ? (
        <Box sx={styles.stateContainer}>
          <Typography
            variant="bodyMedium"
            sx={styles.emptyText}
          >
            {'No evaluation runs yet.\nRun an evaluation to see its results history.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={styles.body}>
          {runs.map(run => (
            <EvaluationRunRow
              key={run.id}
              run={run}
              suiteName={resolveRunSuiteName(run, suiteNamesById)}
              versionName={resolveRunVersionName(run, versions)}
              isSelected={run.id === selectedRunId}
              canDelete={canDelete}
              exportingRunId={exportingRunId}
              gridTemplateColumns={GRID_TEMPLATE_COLUMNS}
              onSelect={onSelect}
              onShare={onShare}
              onExport={onExport}
              onDelete={onDelete}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

EvaluationRunsTable.displayName = 'EvaluationRunsTable';

/** @type {MuiSx} */
const evaluationRunsTableStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: '0.75rem',
    padding: '1.5rem',
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  stateContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
  },
  emptyText: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
    whiteSpace: 'pre-line',
  }),
});

export default EvaluationRunsTable;
