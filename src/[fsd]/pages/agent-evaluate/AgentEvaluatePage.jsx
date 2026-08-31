import { memo, useCallback, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';
import {
  ResultsPanel,
  SuitesPanel,
  parseEvalError,
  useDeleteEvalSuiteMutation,
  useEvalDatasetsQuery,
  useEvalSuitesQuery,
} from '@/[fsd]/widgets/evaluation';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const AgentEvaluatePage = memo(() => {
  const { agentId } = useParams();
  const projectId = useSelectedProjectId();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const { toastError, toastSuccess } = useToast();

  const skip = !projectId || !applicationId;
  const { data: suites = [], isLoading: isSuitesLoading } = useEvalSuitesQuery(
    { projectId, applicationId },
    { skip },
  );
  const { data: datasets = [] } = useEvalDatasetsQuery({ projectId, agentId: applicationId }, { skip });
  const [deleteEvalSuite] = useDeleteEvalSuiteMutation();
  const [suiteToDelete, setSuiteToDelete] = useState(null);

  const datasetNamesById = useMemo(() => Object.fromEntries(datasets.map(d => [d.id, d.name])), [datasets]);

  const handleNewSuite = useCallback(() => {
    // TODO: wire up new suite creation
  }, []);

  const handleDeleteSuite = useCallback(suite => {
    setSuiteToDelete(suite);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setSuiteToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!suiteToDelete) return;
    try {
      await deleteEvalSuite({ projectId, suiteId: suiteToDelete.id }).unwrap();
      toastSuccess('Suite deleted.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete suite.'));
    }
    setSuiteToDelete(null);
  }, [deleteEvalSuite, projectId, suiteToDelete, toastError, toastSuccess]);

  const handleSelectSuite = useCallback(() => {
    // TODO: wire up suite selection / navigation
  }, []);

  const handleOpenHistory = useCallback(() => {
    // TODO: wire up results history
  }, []);

  const styles = agentEvaluatePageStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header} />
      <Box sx={styles.body}>
        <SuitesPanel
          suites={suites}
          isLoading={isSuitesLoading}
          datasetNamesById={datasetNamesById}
          onNewSuite={handleNewSuite}
          onDeleteSuite={handleDeleteSuite}
          onSelectSuite={handleSelectSuite}
        />
        <Box sx={styles.divider} />
        <ResultsPanel onOpenHistory={handleOpenHistory} />
      </Box>
      <Modal.DeleteEntityModal
        open={!!suiteToDelete}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Delete suite?"
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        textContent="Are you sure you want to delete the suite "
        name={suiteToDelete?.name}
        inlineExtraContent="?"
        confirmButtonText="Delete"
      />
    </Box>
  );
});

AgentEvaluatePage.displayName = 'AgentEvaluatePage';

export default AgentEvaluatePage;

/** @type {MuiSx} */
const agentEvaluatePageStyles = () => ({
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
  divider: ({ palette }) => ({
    width: '0.0625rem',
    backgroundColor: palette.border.lines,
    flexShrink: 0,
  }),
});
