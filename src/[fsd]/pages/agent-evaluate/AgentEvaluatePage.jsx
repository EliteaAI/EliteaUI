import { memo, useCallback, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { BreadcrumbsOrTitle, Modal } from '@/[fsd]/shared/ui';
import {
  CreateCaseModal,
  DatasetModal,
  ResultsPanel,
  SuiteDetailPanel,
  SuitesPanel,
  parseEvalError,
  useCreateEvalSuiteMutation,
  useDeleteEvalDatasetCaseMutation,
  useDeleteEvalSuiteMutation,
  useEvalDatasetQuery,
  useEvalDatasetsQuery,
  useEvalDimensionsQuery,
  useEvalSuiteQuery,
  useEvalSuitesQuery,
  useUpdateEvalSuiteMutation,
} from '@/[fsd]/widgets/evaluation';
import { useListModelsQuery } from '@/api/configurations';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

const AgentEvaluatePage = memo(() => {
  const { agentId, tab, suiteId: suiteIdParam } = useParams();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const isCreatingNew = suiteIdParam === 'new';
  const editingSuiteId = useMemo(() => {
    if (!suiteIdParam || suiteIdParam === 'new') return null;
    const parsed = parseInt(suiteIdParam, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [suiteIdParam]);

  const isDetailView = isCreatingNew || editingSuiteId !== null;

  const { toastError, toastSuccess } = useToast();

  const skip = !projectId || !applicationId;
  const { data: suites = [], isLoading: isSuitesLoading } = useEvalSuitesQuery(
    { projectId, applicationId },
    { skip },
  );
  const { data: datasets = [] } = useEvalDatasetsQuery({ projectId, agentId: applicationId }, { skip });
  const { data: dimensions = [] } = useEvalDimensionsQuery({ projectId, agentId: applicationId }, { skip });
  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true, section: 'llm' },
    { skip: !projectId },
  );

  const [deleteEvalSuite] = useDeleteEvalSuiteMutation();
  const [createEvalSuite, { isLoading: isCreating }] = useCreateEvalSuiteMutation();
  const [updateEvalSuite, { isLoading: isUpdating }] = useUpdateEvalSuiteMutation();
  const [deleteEvalDatasetCase] = useDeleteEvalDatasetCaseMutation();

  const [suiteToDelete, setSuiteToDelete] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDatasetDialog, setShowDatasetDialog] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState(null);
  const [caseToDelete, setCaseToDelete] = useState(null);

  const blockOptions = useMemo(
    () => ({
      blockCondition: isDetailView && isDirty,
    }),
    [isDetailView, isDirty],
  );
  const { setBlockNav } = useNavBlocker(blockOptions);

  const { data: suiteDetail, isLoading: isSuiteLoading } = useEvalSuiteQuery(
    { projectId, suiteId: editingSuiteId },
    { skip: !projectId || editingSuiteId == null },
  );

  const activeSuiteDetail = isCreatingNew ? null : suiteDetail;
  const attachedDatasetId = activeSuiteDetail?.dataset_id ?? null;
  const { data: fetchedDatasetDetails } = useEvalDatasetQuery(
    { projectId, datasetId: attachedDatasetId },
    { skip: !projectId || attachedDatasetId == null },
  );
  const attachedDatasetDetails = attachedDatasetId != null ? fetchedDatasetDetails : null;

  const datasetNamesById = useMemo(() => Object.fromEntries(datasets.map(d => [d.id, d.name])), [datasets]);

  const baseEvaluatePath = RouteDefinitions.ApplicationsEvaluate.replace(':tab', tab).replace(
    ':agentId',
    agentId,
  );

  const handleNewSuite = useCallback(() => {
    navigate(`${baseEvaluatePath}/new`);
  }, [navigate, baseEvaluatePath]);

  const handleSelectSuite = useCallback(
    suite => {
      navigate(`${baseEvaluatePath}/${suite.id}`);
    },
    [navigate, baseEvaluatePath],
  );

  const handleBack = useCallback(() => {
    navigate(baseEvaluatePath);
  }, [navigate, baseEvaluatePath]);

  const handleDirtyChange = useCallback(dirty => {
    setIsDirty(dirty);
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
          setBlockNav(false);
          toastSuccess(`The "${formData.name}" suite has been successfully created.`);
          navigate(baseEvaluatePath, { replace: true });
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
          setBlockNav(false);
          toastSuccess(`The "${formData.name}" suite has been successfully saved.`);
        }
      } catch (error) {
        toastError(
          parseEvalError(error, isCreatingNew ? 'Failed to create the suite.' : 'Failed to save the suite.'),
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
      baseEvaluatePath,
      navigate,
      setBlockNav,
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
    const suiteName = suiteToDelete.name;
    const deletedId = suiteToDelete.id;
    try {
      await deleteEvalSuite({ projectId, suiteId: deletedId }).unwrap();
      toastSuccess(`The "${suiteName}" suite has been successfully deleted.`);
      if (editingSuiteId === deletedId) {
        setBlockNav(false);
        navigate(baseEvaluatePath, { replace: true });
      }
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete the suite.'));
    }
    setSuiteToDelete(null);
  }, [
    deleteEvalSuite,
    projectId,
    suiteToDelete,
    editingSuiteId,
    baseEvaluatePath,
    navigate,
    setBlockNav,
    toastError,
    toastSuccess,
  ]);

  const handleOpenHistory = useCallback(() => {
    // TODO: wire up results history
  }, []);

  const handleManageDatasets = useCallback(() => {
    const datasetsPath = RouteDefinitions.ApplicationsEvaluateDatasets.replace(':tab', tab).replace(
      ':agentId',
      agentId,
    );
    navigate(datasetsPath);
  }, [navigate, tab, agentId]);

  const handleCreateDataset = useCallback(() => {
    setShowDatasetDialog(true);
  }, []);

  const handleCloseDatasetDialog = useCallback(() => {
    setShowDatasetDialog(false);
  }, []);

  const handleDatasetSaved = useCallback(
    async dataset => {
      if (!editingSuiteId || !dataset?.id) return;
      try {
        await updateEvalSuite({
          projectId,
          suiteId: editingSuiteId,
          body: { dataset_id: dataset.id },
        }).unwrap();
        toastSuccess(`Dataset "${dataset.name}" has been created and attached to the suite.`);
      } catch (error) {
        toastError(parseEvalError(error, 'Dataset created but failed to attach to suite.'));
      }
    },
    [editingSuiteId, projectId, updateEvalSuite, toastSuccess, toastError],
  );

  const handleAttachDataset = useCallback(
    async dataset => {
      if (!editingSuiteId) return;
      try {
        await updateEvalSuite({
          projectId,
          suiteId: editingSuiteId,
          body: { dataset_id: dataset.id },
        }).unwrap();
        toastSuccess(`Dataset "${dataset.name}" has been attached to the suite.`);
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to attach dataset to the suite.'));
      }
    },
    [editingSuiteId, projectId, updateEvalSuite, toastSuccess, toastError],
  );

  const handleRemoveDataset = useCallback(async () => {
    if (!editingSuiteId) return;
    try {
      await updateEvalSuite({
        projectId,
        suiteId: editingSuiteId,
        body: { dataset_id: null },
      }).unwrap();
      toastSuccess('Dataset has been removed from the suite.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to remove dataset from the suite.'));
    }
  }, [editingSuiteId, projectId, updateEvalSuite, toastSuccess, toastError]);

  const handleAddCase = useCallback(() => {
    setCaseToEdit(null);
    setShowCaseModal(true);
  }, []);

  const handleEditCase = useCallback(datasetCase => {
    setCaseToEdit(datasetCase);
    setShowCaseModal(true);
  }, []);

  const handleCloseCaseModal = useCallback(() => {
    setShowCaseModal(false);
    setCaseToEdit(null);
  }, []);

  const handleDeleteCase = useCallback(datasetCase => {
    setCaseToDelete(datasetCase);
  }, []);

  const handleCloseDeleteCase = useCallback(() => {
    setCaseToDelete(null);
  }, []);

  const handleConfirmDeleteCase = useCallback(async () => {
    if (!caseToDelete || !attachedDatasetId) return;
    try {
      await deleteEvalDatasetCase({
        projectId,
        datasetId: attachedDatasetId,
        caseId: caseToDelete.id,
      }).unwrap();
      toastSuccess('Case has been successfully deleted.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete the case.'));
    }
    setCaseToDelete(null);
  }, [caseToDelete, attachedDatasetId, deleteEvalDatasetCase, projectId, toastSuccess, toastError]);

  const handleOpenDataset = useCallback(
    dataset => {
      const datasetsPath = RouteDefinitions.ApplicationsEvaluateDatasets.replace(':tab', tab).replace(
        ':agentId',
        agentId,
      );
      navigate(`${datasetsPath}?datasetId=${dataset.id}`);
    },
    [navigate, tab, agentId],
  );

  const handleImportCases = useCallback(() => {
    // TODO: open import cases dialog
  }, []);

  const handlePromoteCases = useCallback(() => {
    // TODO: open promote from chats & runs dialog
  }, []);

  const handleManageDimensions = useCallback(() => {
    // TODO: navigate to dimensions management
  }, []);

  const handleCreateDimension = useCallback(() => {
    // TODO: open create dimension dialog
  }, []);

  const styles = agentEvaluatePageStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <BreadcrumbsOrTitle title="Evaluation" />
      </Box>
      <Box sx={styles.body}>
        {isDetailView ? (
          <SuiteDetailPanel
            suite={suiteDetail}
            isNew={isCreatingNew}
            isLoading={!isCreatingNew && isSuiteLoading}
            modelsData={modelsData}
            datasets={datasets}
            attachedDataset={attachedDatasetDetails}
            dimensions={dimensions}
            isSaving={isCreating || isUpdating}
            onBack={handleBack}
            onSave={handleSave}
            onDelete={handleDeleteSuite}
            onEvaluate={handleEvaluate}
            onDirtyChange={handleDirtyChange}
            onManageDatasets={handleManageDatasets}
            onCreateDataset={handleCreateDataset}
            onAttachDataset={handleAttachDataset}
            onRemoveDataset={handleRemoveDataset}
            onOpenDataset={handleOpenDataset}
            onAddCase={handleAddCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
            onImportCases={handleImportCases}
            onPromoteCases={handlePromoteCases}
            onManageDimensions={handleManageDimensions}
            onCreateDimension={handleCreateDimension}
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
      <DatasetModal
        open={showDatasetDialog}
        onClose={handleCloseDatasetDialog}
        projectId={projectId}
        applicationId={applicationId}
        dataset={null}
        onSaved={handleDatasetSaved}
      />
      {attachedDatasetId && (
        <CreateCaseModal
          open={showCaseModal}
          onClose={handleCloseCaseModal}
          projectId={projectId}
          datasetId={attachedDatasetId}
          datasetCase={caseToEdit}
        />
      )}
      <Modal.DeleteEntityModal
        open={!!caseToDelete}
        onClose={handleCloseDeleteCase}
        onConfirm={handleConfirmDeleteCase}
        title="Delete confirmation"
        textContent="Are you sure to delete the "
        name={caseToDelete?.input?.slice(0, 50) || `Case ${caseToDelete?.id ?? ''}`}
        confirmButtonText="Delete"
      />
    </Box>
  );
});

AgentEvaluatePage.displayName = 'AgentEvaluatePage';

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

export default AgentEvaluatePage;
