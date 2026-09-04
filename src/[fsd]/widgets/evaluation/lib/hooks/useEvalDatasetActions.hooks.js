import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import { useUpdateEvalSuiteMutation } from '../../api';
import { parseEvalError } from '../helpers';

export const useEvalDatasetActions = ({ projectId, editingSuiteId, agentId, tab }) => {
  const navigate = useNavigate();
  const { toastError, toastSuccess } = useToast();

  const [updateEvalSuite] = useUpdateEvalSuiteMutation();

  const [showDatasetDialog, setShowDatasetDialog] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showChatsModal, setShowChatsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState(null);
  const [pendingDatasetId, setPendingDatasetId] = useState(null);

  useEffect(() => {
    setShowDatasetDialog(false);
    setShowCaseModal(false);
    setShowChatsModal(false);
    setShowImportModal(false);
    setCaseToEdit(null);
    setPendingDatasetId(null);
  }, [editingSuiteId]);

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
      if (!dataset?.id) return;
      if (!editingSuiteId) {
        setPendingDatasetId(dataset.id);
        toastSuccess(`Dataset "${dataset.name}" has been created and attached to the suite.`);
        return;
      }
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
      if (!editingSuiteId) {
        setPendingDatasetId(dataset.id);
        return;
      }
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
    if (!editingSuiteId) {
      setPendingDatasetId(null);
      return;
    }
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

  const handleRemoveCase = useCallback(
    datasetCase => {
      // eslint-disable-next-line no-console
      console.warn('Remove case from suite not implemented yet. Case:', datasetCase?.id);
      toastError('Remove case from suite is not available yet. Please use Manage Datasets to delete cases.');
    },
    [toastError],
  );

  const handleImportCases = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const handleCloseImportModal = useCallback(() => {
    setShowImportModal(false);
  }, []);

  const handlePromoteCases = useCallback(() => {
    setShowChatsModal(true);
  }, []);

  const handleCloseChatsModal = useCallback(() => {
    setShowChatsModal(false);
  }, []);

  const flushPendingDataset = useCallback(
    async suiteId => {
      if (pendingDatasetId == null) return;
      try {
        await updateEvalSuite({
          projectId,
          suiteId,
          body: { dataset_id: pendingDatasetId },
        }).unwrap();
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to attach dataset to suite.'));
      }
      setPendingDatasetId(null);
    },
    [pendingDatasetId, updateEvalSuite, projectId, toastError],
  );

  return {
    showDatasetDialog,
    showCaseModal,
    showChatsModal,
    showImportModal,
    caseToEdit,
    pendingDatasetId,
    handleManageDatasets,
    handleCreateDataset,
    handleCloseDatasetDialog,
    handleDatasetSaved,
    handleAttachDataset,
    handleRemoveDataset,
    handleOpenDataset,
    handleAddCase,
    handleEditCase,
    handleCloseCaseModal,
    handleRemoveCase,
    handleImportCases,
    handleCloseImportModal,
    handlePromoteCases,
    handleCloseChatsModal,
    flushPendingDataset,
  };
};
