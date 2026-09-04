import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import {
  useEvalSuiteCaseExclusionsQuery,
  useUpdateEvalSuiteCaseExclusionsMutation,
  useUpdateEvalSuiteMutation,
} from '../../api';
import { parseEvalError } from '../helpers';

export const useEvalDatasetActions = ({ projectId, editingSuiteId, agentId, tab }) => {
  const navigate = useNavigate();
  const { toastError, toastSuccess } = useToast();

  const [updateEvalSuite] = useUpdateEvalSuiteMutation();
  const [updateExclusions] = useUpdateEvalSuiteCaseExclusionsMutation();

  // Get current exclusions for the suite
  const { data: exclusionsData } = useEvalSuiteCaseExclusionsQuery(
    { projectId, suiteId: editingSuiteId },
    { skip: !projectId || !editingSuiteId },
  );

  const excludedCaseIds = useMemo(() => exclusionsData?.case_ids ?? [], [exclusionsData?.case_ids]);

  const [showDatasetDialog, setShowDatasetDialog] = useState(false);
  const [showExcludeCaseConfirm, setShowExcludeCaseConfirm] = useState(false);
  const [caseToExclude, setCaseToExclude] = useState(null);
  const [pendingDatasetId, setPendingDatasetId] = useState(null);

  useEffect(() => {
    setShowDatasetDialog(false);
    setShowExcludeCaseConfirm(false);
    setCaseToExclude(null);
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

  // ---- Case exclusion (from suite) ----

  const handleExcludeCase = useCallback(datasetCase => {
    if (!datasetCase?.id) return;
    setCaseToExclude(datasetCase);
    setShowExcludeCaseConfirm(true);
  }, []);

  const handleCloseExcludeCaseConfirm = useCallback(() => {
    setShowExcludeCaseConfirm(false);
    setCaseToExclude(null);
  }, []);

  const handleConfirmExcludeCase = useCallback(async () => {
    if (!caseToExclude?.id || !editingSuiteId) return;

    try {
      const newExclusions = [...new Set([...excludedCaseIds, caseToExclude.id])];
      await updateExclusions({
        projectId,
        suiteId: editingSuiteId,
        caseIds: newExclusions,
      }).unwrap();
      toastSuccess('Case has been excluded from this suite.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to exclude case from suite.'));
    } finally {
      setShowExcludeCaseConfirm(false);
      setCaseToExclude(null);
    }
  }, [caseToExclude, editingSuiteId, excludedCaseIds, updateExclusions, projectId, toastSuccess, toastError]);

  const handleIncludeCase = useCallback(
    async datasetCase => {
      if (!datasetCase?.id || !editingSuiteId) return;

      try {
        const newExclusions = excludedCaseIds.filter(id => id !== datasetCase.id);
        await updateExclusions({
          projectId,
          suiteId: editingSuiteId,
          caseIds: newExclusions,
        }).unwrap();
        toastSuccess('Case has been included in this suite.');
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to include case in suite.'));
      }
    },
    [editingSuiteId, excludedCaseIds, updateExclusions, projectId, toastSuccess, toastError],
  );

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
    showExcludeCaseConfirm,
    caseToExclude,
    excludedCaseIds,
    pendingDatasetId,
    handleManageDatasets,
    handleCreateDataset,
    handleCloseDatasetDialog,
    handleDatasetSaved,
    handleAttachDataset,
    handleRemoveDataset,
    handleOpenDataset,
    handleExcludeCase,
    handleCloseExcludeCaseConfirm,
    handleConfirmExcludeCase,
    handleIncludeCase,
    flushPendingDataset,
  };
};
