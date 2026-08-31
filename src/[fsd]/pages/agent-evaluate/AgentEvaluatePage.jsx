import { memo, useCallback, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import {
  ResultsPanel,
  SuiteDetailPanel,
  SuitesPanel,
  parseEvalError,
  useCreateEvalSuiteMutation,
  useDeleteEvalSuiteMutation,
  useEvalDatasetsQuery,
  useEvalSuiteQuery,
  useEvalSuitesQuery,
  useUpdateEvalSuiteMutation,
} from '@/[fsd]/widgets/evaluation';
import { useListModelsQuery } from '@/api/configurations';
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
  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true, section: 'llm' },
    { skip: !projectId },
  );

  const [deleteEvalSuite] = useDeleteEvalSuiteMutation();
  const [createEvalSuite, { isLoading: isCreating }] = useCreateEvalSuiteMutation();
  const [updateEvalSuite, { isLoading: isUpdating }] = useUpdateEvalSuiteMutation();

  const [suiteToDelete, setSuiteToDelete] = useState(null);
  const [editingSuiteId, setEditingSuiteId] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const isDetailView = isCreatingNew || editingSuiteId !== null;

  const { data: suiteDetail } = useEvalSuiteQuery(
    { projectId, suiteId: editingSuiteId },
    { skip: !projectId || editingSuiteId == null },
  );

  const datasetNamesById = useMemo(() => Object.fromEntries(datasets.map(d => [d.id, d.name])), [datasets]);

  const handleNewSuite = useCallback(() => {
    setIsCreatingNew(true);
    setEditingSuiteId(null);
  }, []);

  const handleSelectSuite = useCallback(suite => {
    setEditingSuiteId(suite.id);
    setIsCreatingNew(false);
  }, []);

  const handleBack = useCallback(() => {
    setEditingSuiteId(null);
    setIsCreatingNew(false);
  }, []);

  const handleSave = useCallback(
    async formData => {
      try {
        if (isCreatingNew) {
          await createEvalSuite({
            projectId,
            body: {
              application_id: applicationId,
              name: formData.name,
              description: formData.description,
              judge_model: formData.judge_model,
            },
          }).unwrap();
          toastSuccess('Suite created.');
          setIsCreatingNew(false);
          setEditingSuiteId(null);
        } else if (editingSuiteId != null) {
          await updateEvalSuite({
            projectId,
            suiteId: editingSuiteId,
            body: {
              name: formData.name,
              description: formData.description,
              judge_model: formData.judge_model,
            },
          }).unwrap();
          toastSuccess('Suite saved.');
        }
      } catch (error) {
        toastError(
          parseEvalError(error, isCreatingNew ? 'Failed to create suite.' : 'Failed to save suite.'),
        );
      }
    },
    [
      isCreatingNew,
      editingSuiteId,
      createEvalSuite,
      updateEvalSuite,
      projectId,
      applicationId,
      toastSuccess,
      toastError,
    ],
  );

  const handleEvaluate = useCallback(() => {
    // TODO: wire up evaluation run
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
      if (editingSuiteId === suiteToDelete.id) {
        setEditingSuiteId(null);
      }
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete suite.'));
    }
    setSuiteToDelete(null);
  }, [deleteEvalSuite, projectId, suiteToDelete, editingSuiteId, toastError, toastSuccess]);

  const handleOpenHistory = useCallback(() => {
    // TODO: wire up results history
  }, []);

  const styles = agentEvaluatePageStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header} />
      <Box sx={styles.body}>
        {isDetailView ? (
          <SuiteDetailPanel
            suite={suiteDetail}
            isNew={isCreatingNew}
            modelsData={modelsData}
            isSaving={isCreating || isUpdating}
            onBack={handleBack}
            onSave={handleSave}
            onDelete={handleDeleteSuite}
            onEvaluate={handleEvaluate}
          />
        ) : (
          <SuitesPanel
            suites={suites}
            isLoading={isSuitesLoading}
            datasetNamesById={datasetNamesById}
            onNewSuite={handleNewSuite}
            onDeleteSuite={handleDeleteSuite}
            onSelectSuite={handleSelectSuite}
          />
        )}
        <Box sx={styles.divider} />
        <ResultsPanel onOpenHistory={handleOpenHistory} />
      </Box>
      <Modal.DeleteEntityModal
        open={!!suiteToDelete}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Delete confirmation"
        textContent="Are you sure to delete the "
        name={suiteToDelete?.name}
        shouldRequestInputName
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
