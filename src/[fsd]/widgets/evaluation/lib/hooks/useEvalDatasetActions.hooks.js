import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams } from '@/common/constants';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import {
  useEvalSuiteCaseExclusionsQuery,
  useUpdateEvalSuiteCaseExclusionsMutation,
  useUpdateEvalSuiteMutation,
} from '../../api';
import { caseExcludedMessage, caseIncludedMessage, parseEvalError, withSuiteSearchParam } from '../helpers';

export const useEvalDatasetActions = ({ projectId, editingSuiteId, agentId, tab }) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const persistentSearch = NavigationHelpers.pickPersistentSearch(search);
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

  useEffect(() => {
    setShowDatasetDialog(false);
  }, [editingSuiteId]);

  const handleManageDatasets = useCallback(() => {
    const datasetsPath = RouteDefinitions.ApplicationsEvaluateDatasets.replace(':tab', tab).replace(
      ':agentId',
      agentId,
    );
    navigate({
      pathname: datasetsPath,
      search: withSuiteSearchParam(persistentSearch, editingSuiteId),
    });
  }, [navigate, tab, agentId, persistentSearch, editingSuiteId]);

  const handleCreateDataset = useCallback(() => {
    setShowDatasetDialog(true);
  }, []);

  const handleCloseDatasetDialog = useCallback(() => {
    setShowDatasetDialog(false);
  }, []);

  const handleDatasetSaved = useCallback(
    async dataset => {
      if (!dataset?.id || !editingSuiteId) return;
      try {
        await updateEvalSuite({
          projectId,
          suiteId: editingSuiteId,
          body: { dataset_id: dataset.id },
        }).unwrap();
        toastSuccess(`Dataset "${dataset.name}" has been created and attached to the suite.`);
        // Redirect to manage datasets page with the created dataset selected
        const datasetsPath = RouteDefinitions.ApplicationsEvaluateDatasets.replace(':tab', tab).replace(
          ':agentId',
          agentId,
        );
        const newParams = new URLSearchParams(withSuiteSearchParam(persistentSearch, editingSuiteId));
        newParams.set(SearchParams.DatasetId, dataset.id);
        navigate({ pathname: datasetsPath, search: newParams.toString() });
      } catch (error) {
        toastError(parseEvalError(error, 'Dataset created but failed to attach to suite.'));
      }
    },
    [
      editingSuiteId,
      projectId,
      updateEvalSuite,
      toastSuccess,
      toastError,
      navigate,
      tab,
      agentId,
      persistentSearch,
    ],
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

  const handleOpenDataset = useCallback(
    dataset => {
      const datasetsPath = RouteDefinitions.ApplicationsEvaluateDatasets.replace(':tab', tab).replace(
        ':agentId',
        agentId,
      );
      const newParams = new URLSearchParams(withSuiteSearchParam(persistentSearch, editingSuiteId));
      newParams.set(SearchParams.DatasetId, dataset.id);
      navigate({ pathname: datasetsPath, search: newParams.toString() });
    },
    [navigate, tab, agentId, persistentSearch, editingSuiteId],
  );

  // ---- Case exclusion (from suite) ----

  const handleExcludeCase = useCallback(
    async datasetCase => {
      if (!datasetCase?.id || !editingSuiteId) return;

      try {
        const newExclusions = [...new Set([...excludedCaseIds, datasetCase.id])];
        await updateExclusions({
          projectId,
          suiteId: editingSuiteId,
          caseIds: newExclusions,
        }).unwrap();
        toastSuccess(caseExcludedMessage(datasetCase.id));
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to exclude case from suite.'));
      }
    },
    [editingSuiteId, excludedCaseIds, updateExclusions, projectId, toastSuccess, toastError],
  );

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
        toastSuccess(caseIncludedMessage(datasetCase.id));
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to include case in suite.'));
      }
    },
    [editingSuiteId, excludedCaseIds, updateExclusions, projectId, toastSuccess, toastError],
  );

  return {
    showDatasetDialog,
    excludedCaseIds,
    handleManageDatasets,
    handleCreateDataset,
    handleCloseDatasetDialog,
    handleDatasetSaved,
    handleAttachDataset,
    handleRemoveDataset,
    handleOpenDataset,
    handleExcludeCase,
    handleIncludeCase,
  };
};
