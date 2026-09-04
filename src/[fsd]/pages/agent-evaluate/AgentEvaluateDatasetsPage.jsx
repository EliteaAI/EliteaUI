import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { BreadcrumbsOrTitle, Modal } from '@/[fsd]/shared/ui';
import {
  AddCaseFromChatsModal,
  CasesPanel,
  CreateCaseModal,
  DatasetModal,
  DatasetsPanel,
  ImportCaseModal,
  parseEvalError,
  sortDatasetsByDate,
  useDeleteEvalDatasetCaseMutation,
  useDeleteEvalDatasetMutation,
  useEvalDatasetQuery,
  useEvalDatasetsQuery,
} from '@/[fsd]/widgets/evaluation';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const AgentEvaluateDatasetsPage = memo(() => {
  const { agentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const initialDatasetId = searchParams.get('datasetId') ? parseInt(searchParams.get('datasetId'), 10) : null;

  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDatasetId);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [datasetToEdit, setDatasetToEdit] = useState(null);
  const [datasetToDelete, setDatasetToDelete] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState(null);
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [casesToBulkDelete, setCasesToBulkDelete] = useState(null);
  const [showChatsModal, setShowChatsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const skip = !projectId || !applicationId;

  const { data: datasets = [], isError: isDatasetsError } = useEvalDatasetsQuery(
    { projectId, agentId: applicationId },
    { skip },
  );

  const {
    data: selectedDatasetDetails,
    isLoading: isDatasetLoading,
    isFetching: isDatasetFetching,
  } = useEvalDatasetQuery(
    {
      projectId,
      datasetId: selectedDatasetId,
    },
    { skip: !projectId || selectedDatasetId == null },
  );

  const [deleteDataset, { isLoading: isDeleting }] = useDeleteEvalDatasetMutation();
  const [deleteDatasetCase, { isLoading: isDeletingCase }] = useDeleteEvalDatasetCaseMutation();

  const selectedDataset = useMemo(
    () => datasets.find(d => d.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );

  const sortedDatasets = useMemo(() => sortDatasetsByDate(datasets), [datasets]);

  useEffect(() => {
    if (!selectedDatasetId && sortedDatasets.length > 0) {
      const firstDataset = initialDatasetId
        ? sortedDatasets.find(d => d.id === initialDatasetId)
        : sortedDatasets[0];
      if (firstDataset) {
        setSelectedDatasetId(firstDataset.id);
      }
    }
  }, [sortedDatasets, selectedDatasetId, initialDatasetId]);

  useEffect(() => {
    if (selectedDatasetId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('datasetId', String(selectedDatasetId));
      setSearchParams(newParams, { replace: true });
    }
  }, [selectedDatasetId, searchParams, setSearchParams]);

  const handleSelectDataset = useCallback(dataset => {
    setSelectedDatasetId(dataset.id);
  }, []);

  const handleCreateDataset = useCallback(() => {
    setDatasetToEdit(null);
    setShowDatasetModal(true);
  }, []);

  const handleEditDataset = useCallback(dataset => {
    setDatasetToEdit(dataset);
    setShowDatasetModal(true);
  }, []);

  const handleCloseDatasetModal = useCallback(() => {
    setShowDatasetModal(false);
    setDatasetToEdit(null);
  }, []);

  const handleDatasetSaved = useCallback(
    dataset => {
      if (dataset?.id && !datasetToEdit) {
        setSelectedDatasetId(dataset.id);
      }
    },
    [datasetToEdit],
  );

  const handleDeleteDataset = useCallback(dataset => {
    setDatasetToDelete(dataset);
  }, []);

  const handleCloseDeleteDataset = useCallback(() => {
    setDatasetToDelete(null);
  }, []);

  const handleConfirmDeleteDataset = useCallback(async () => {
    if (!datasetToDelete) return;
    try {
      await deleteDataset({ projectId, datasetId: datasetToDelete.id }).unwrap();
      toastSuccess(`Dataset "${datasetToDelete.name}" has been deleted.`);
      if (selectedDatasetId === datasetToDelete.id) {
        const remaining = sortedDatasets.filter(d => d.id !== datasetToDelete.id);
        setSelectedDatasetId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete dataset.'));
    }
    setDatasetToDelete(null);
  }, [
    datasetToDelete,
    deleteDataset,
    projectId,
    selectedDatasetId,
    sortedDatasets,
    toastSuccess,
    toastError,
  ]);

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
    if (!caseToDelete || !selectedDatasetId) return;
    try {
      await deleteDatasetCase({
        projectId,
        datasetId: selectedDatasetId,
        caseId: caseToDelete.id,
      }).unwrap();
      toastSuccess('Case has been deleted.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete case.'));
    }
    setCaseToDelete(null);
  }, [caseToDelete, selectedDatasetId, deleteDatasetCase, projectId, toastSuccess, toastError]);

  const handleBulkDelete = useCallback(cases => {
    if (cases.length === 0) return;
    setCasesToBulkDelete(cases);
  }, []);

  const handleCloseBulkDelete = useCallback(() => {
    setCasesToBulkDelete(null);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!casesToBulkDelete || casesToBulkDelete.length === 0 || !selectedDatasetId) return;
    try {
      const results = await Promise.allSettled(
        casesToBulkDelete.map(c =>
          deleteDatasetCase({
            projectId,
            datasetId: selectedDatasetId,
            caseId: c.id,
          }).unwrap(),
        ),
      );
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (failCount === 0) {
        toastSuccess(`${successCount} case${successCount === 1 ? '' : 's'} deleted.`);
      } else if (successCount > 0) {
        toastSuccess(`${successCount} case${successCount === 1 ? '' : 's'} deleted. ${failCount} failed.`);
      } else {
        toastError('Failed to delete cases.');
      }
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete cases.'));
    }
    setCasesToBulkDelete(null);
  }, [casesToBulkDelete, selectedDatasetId, deleteDatasetCase, projectId, toastSuccess, toastError]);

  const handleFromChatsRuns = useCallback(() => {
    setShowChatsModal(true);
  }, []);

  const handleCloseChatsModal = useCallback(() => {
    setShowChatsModal(false);
  }, []);

  const handleImportFile = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const handleCloseImportModal = useCallback(() => {
    setShowImportModal(false);
  }, []);

  const cases = selectedDatasetDetails?.cases ?? [];

  const styles = agentEvaluateDatasetsPageStyles();

  if (isDatasetsError) {
    return (
      <Box sx={styles.wrapper}>
        <Box sx={styles.header}>
          <BreadcrumbsOrTitle title="Manage Datasets" />
        </Box>
        <Box sx={styles.body}>
          <Box sx={styles.errorState}>
            <Typography
              variant="bodyMedium"
              sx={styles.errorText}
            >
              Failed to load datasets. Please try refreshing the page.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <BreadcrumbsOrTitle title="Manage Datasets" />
      </Box>
      <Box sx={styles.body}>
        <DatasetsPanel
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          applicationId={applicationId}
          onSelect={handleSelectDataset}
          onCreate={handleCreateDataset}
          onRename={handleEditDataset}
          onDelete={handleDeleteDataset}
        />
        <CasesPanel
          dataset={selectedDataset}
          applicationId={applicationId}
          cases={cases}
          isLoading={isDatasetLoading || isDatasetFetching}
          onAddCase={handleAddCase}
          onImportFile={handleImportFile}
          onFromChatsRuns={handleFromChatsRuns}
          onEditCase={handleEditCase}
          onDeleteCase={handleDeleteCase}
          onBulkDelete={handleBulkDelete}
        />
      </Box>

      <DatasetModal
        open={showDatasetModal}
        onClose={handleCloseDatasetModal}
        projectId={projectId}
        applicationId={applicationId}
        dataset={datasetToEdit}
        onSaved={handleDatasetSaved}
      />

      <Modal.DeleteEntityModal
        open={!!datasetToDelete}
        onClose={handleCloseDeleteDataset}
        onConfirm={handleConfirmDeleteDataset}
        title="Delete confirmation"
        textContent="Are you sure you want to delete "
        name={datasetToDelete?.name || ''}
        inlineExtraContent="? All cases in this dataset will also be deleted. This action can't be undone."
        shouldRequestInputName
        confirmButtonText="Delete"
        confirming={isDeleting}
        alarm
      />

      {selectedDatasetId && (
        <>
          <CreateCaseModal
            open={showCaseModal}
            onClose={handleCloseCaseModal}
            projectId={projectId}
            datasetId={selectedDatasetId}
            datasetCase={caseToEdit}
          />
          <AddCaseFromChatsModal
            open={showChatsModal}
            onClose={handleCloseChatsModal}
            projectId={projectId}
            datasetId={selectedDatasetId}
            applicationId={applicationId}
          />
          <ImportCaseModal
            open={showImportModal}
            onClose={handleCloseImportModal}
            projectId={projectId}
            datasetId={selectedDatasetId}
          />
        </>
      )}

      <Modal.DeleteEntityModal
        open={!!caseToDelete}
        onClose={handleCloseDeleteCase}
        onConfirm={handleConfirmDeleteCase}
        title="Delete confirmation"
        textContent="Are you sure you want to delete "
        name={caseToDelete?.input?.split('\n')[0]?.slice(0, 50) || 'this case'}
        inlineExtraContent="? It can't be restored."
        shouldRequestInputName
        confirmButtonText="Delete"
        confirming={isDeletingCase}
      />

      <Modal.DeleteEntityModal
        open={!!casesToBulkDelete}
        onClose={handleCloseBulkDelete}
        onConfirm={handleConfirmBulkDelete}
        title="Delete confirmation"
        textContent={`Are you sure you want to delete the selected ${casesToBulkDelete?.length ?? 0} case${(casesToBulkDelete?.length ?? 0) === 1 ? '' : 's'}? They can't be restored.`}
        name=""
        confirmButtonText="Delete"
        confirming={isDeletingCase}
        inlineExtraContent=" "
      />
    </Box>
  );
});

AgentEvaluateDatasetsPage.displayName = 'AgentEvaluateDatasetsPage';

/** @type {MuiSx} */
const agentEvaluateDatasetsPageStyles = () => ({
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
  errorState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
  },
  errorText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default AgentEvaluateDatasetsPage;
