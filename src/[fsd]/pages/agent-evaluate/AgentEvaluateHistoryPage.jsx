import { memo, useMemo } from 'react';

import { useParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { BreadcrumbsOrTitle, Modal } from '@/[fsd]/shared/ui';
import { EvaluationRunsTable, RunResultsView, useEvalRunHistory } from '@/[fsd]/widgets/evaluation';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const AgentEvaluateHistoryPage = memo(() => {
  const { agentId } = useParams();
  const projectId = useSelectedProjectId();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const {
    runs,
    suiteNamesById,
    isRunsLoading,
    isRunsError,
    selectedRunId,
    selectedRun,
    isSelectedRunLoading,
    canDelete,
    sortConfig,
    handleSort,
    handleSelectRun,
    handleShareRun,
    handleExportRun,
    runToDelete,
    isDeleting,
    handleRequestDelete,
    handleCloseDelete,
    handleConfirmDelete,
  } = useEvalRunHistory({ projectId, applicationId });

  const styles = agentEvaluateHistoryPageStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <BreadcrumbsOrTitle title="Results History" />
      </Box>

      {isRunsError ? (
        <Box sx={styles.body}>
          <Box sx={styles.stateContainer}>
            <Typography
              variant="bodyMedium"
              sx={styles.stateText}
            >
              Failed to load the results history. Please try refreshing the page.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={styles.body}>
          <Box sx={styles.leftPanel}>
            <EvaluationRunsTable
              runs={runs}
              suiteNamesById={suiteNamesById}
              selectedRunId={selectedRunId}
              isLoading={isRunsLoading}
              canDelete={canDelete}
              sortConfig={sortConfig}
              onSort={handleSort}
              onSelect={handleSelectRun}
              onShare={handleShareRun}
              onExport={handleExportRun}
              onDelete={handleRequestDelete}
            />
          </Box>
          <Box sx={styles.divider} />
          <Box sx={styles.rightPanel}>
            {selectedRunId == null && !isRunsLoading ? (
              <Box sx={styles.stateContainer}>
                <Typography
                  variant="bodyMedium"
                  sx={styles.stateText}
                >
                  Select an evaluation run to view its results.
                </Typography>
              </Box>
            ) : (
              <RunResultsView
                run={selectedRun}
                applicationId={applicationId}
                isLoading={isRunsLoading || isSelectedRunLoading}
              />
            )}
          </Box>
        </Box>
      )}

      <Modal.DeleteEntityModal
        open={!!runToDelete}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Remove run?"
        textContent="Are you sure you want to remove this evaluation run?"
        name=""
        inlineExtraContent=" "
        confirmButtonText="Remove"
        confirming={isDeleting}
        alarm
      />
    </Box>
  );
});

AgentEvaluateHistoryPage.displayName = 'AgentEvaluateHistoryPage';

/** @type {MuiSx} */
const agentEvaluateHistoryPageStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    width: '100%',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
  }),
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    width: '45%',
    minWidth: 0,
    overflow: 'hidden',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    width: '55%',
    minWidth: 0,
    overflowY: 'auto',
    padding: '1.5rem 0',
  },
  divider: ({ palette }) => ({
    width: '0.0625rem',
    backgroundColor: palette.border.lines,
    flexShrink: 0,
  }),
  stateContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
  },
  stateText: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
});

export default AgentEvaluateHistoryPage;
