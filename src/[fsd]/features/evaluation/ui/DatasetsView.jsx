import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { useDeleteEvalDatasetMutation, useEvalDatasetsQuery } from '../api';
import { EVAL_PERMISSIONS, NEW_DATASET_MENU } from '../lib/constants';
import { parseEvalError } from '../lib/helpers';
import DatasetDetailView from './DatasetDetailView';
import DatasetFormDialog from './DatasetFormDialog';
import DatasetImportDialog from './DatasetImportDialog';
import DatasetList from './DatasetList';
import PromoteConversationsDialog from './PromoteConversationsDialog';

const DatasetsView = memo(props => {
  const {
    isFetching: isAppFetching,
    isError: isAppError,
    initialDatasetId = null,
    applicationId = null,
  } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();

  const canCreate = checkPermission(EVAL_PERMISSIONS.datasetCreate);
  const canUpdate = checkPermission(EVAL_PERMISSIONS.datasetUpdate);
  const canDelete = checkPermission(EVAL_PERMISSIONS.datasetDelete);

  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDatasetId);
  const [formDialog, setFormDialog] = useState({ open: false, dataset: null, thenAction: null });
  const [importDialog, setImportDialog] = useState({ open: false, datasetId: null });
  const [promoteDialog, setPromoteDialog] = useState({ open: false, datasetId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    data: datasets = [],
    isLoading,
    isError,
  } = useEvalDatasetsQuery({ projectId }, { skip: !projectId });

  const [deleteDataset, { isLoading: isDeleting }] = useDeleteEvalDatasetMutation();

  const selectedDataset = useMemo(
    () => datasets.find(d => d.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );

  const openDataset = useCallback(dataset => setSelectedDatasetId(dataset.id), []);
  const backToList = useCallback(() => setSelectedDatasetId(null), []);

  const openCreateForm = useCallback((thenAction = null) => {
    setFormDialog({ open: true, dataset: null, thenAction });
  }, []);
  const openRenameForm = useCallback(dataset => {
    setFormDialog({ open: true, dataset, thenAction: null });
  }, []);
  const closeForm = useCallback(() => {
    setFormDialog({ open: false, dataset: null, thenAction: null });
  }, []);

  const handleNewSelect = useCallback(
    key => {
      if (key === NEW_DATASET_MENU.blank) openCreateForm(null);
      else if (key === NEW_DATASET_MENU.import) openCreateForm(NEW_DATASET_MENU.import);
      else if (key === NEW_DATASET_MENU.fromConversations) openCreateForm(NEW_DATASET_MENU.fromConversations);
    },
    [openCreateForm],
  );

  const handleFormSaved = useCallback(
    result => {
      if (result?.id == null) return;
      const thenAction = formDialog.thenAction;
      setSelectedDatasetId(result.id);
      if (thenAction === NEW_DATASET_MENU.import) {
        setImportDialog({ open: true, datasetId: result.id });
      } else if (thenAction === NEW_DATASET_MENU.fromConversations) {
        setPromoteDialog({ open: true, datasetId: result.id });
      }
    },
    [formDialog.thenAction],
  );

  const openImport = useCallback(dataset => setImportDialog({ open: true, datasetId: dataset.id }), []);
  const closeImport = useCallback(() => setImportDialog({ open: false, datasetId: null }), []);
  const openPromote = useCallback(dataset => setPromoteDialog({ open: true, datasetId: dataset.id }), []);
  const closePromote = useCallback(() => setPromoteDialog({ open: false, datasetId: null }), []);

  const requestDelete = useCallback(dataset => setDeleteTarget(dataset), []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteDataset({ projectId, datasetId: deleteTarget.id }).unwrap();
      toastSuccess('Dataset deleted.');
      if (selectedDatasetId === deleteTarget.id) setSelectedDatasetId(null);
      setDeleteTarget(null);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete dataset.'));
    }
  }, [deleteTarget, deleteDataset, projectId, selectedDatasetId, toastSuccess, toastError]);

  const styles = datasetsViewStyles();

  if (isAppError || isError) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-datasets-view"
      >
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Failed to load datasets! Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  if (isAppFetching || isLoading) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-datasets-view"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {selectedDataset ? (
        <DatasetDetailView
          datasetId={selectedDataset.id}
          canUpdate={canUpdate}
          onBack={backToList}
          onImport={openImport}
          onPromote={openPromote}
        />
      ) : (
        <DatasetList
          datasets={datasets}
          canCreate={canCreate}
          canEdit={canUpdate}
          canDelete={canDelete}
          onOpen={openDataset}
          onRename={openRenameForm}
          onDelete={requestDelete}
          onNewSelect={handleNewSelect}
        />
      )}

      <DatasetFormDialog
        open={formDialog.open}
        projectId={projectId}
        dataset={formDialog.dataset}
        onSaved={handleFormSaved}
        onClose={closeForm}
      />

      <DatasetImportDialog
        open={importDialog.open}
        projectId={projectId}
        datasetId={importDialog.datasetId}
        onClose={closeImport}
      />

      <PromoteConversationsDialog
        open={promoteDialog.open}
        projectId={projectId}
        datasetId={promoteDialog.datasetId}
        applicationId={applicationId}
        onClose={closePromote}
      />

      <Modal.DeleteEntityModal
        open={!!deleteTarget}
        name={deleteTarget?.name}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        alarm
        confirming={isDeleting}
      />
    </>
  );
});

DatasetsView.displayName = 'DatasetsView';

/** @type {MuiSx} */
const datasetsViewStyles = () => ({
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});

export default DatasetsView;
