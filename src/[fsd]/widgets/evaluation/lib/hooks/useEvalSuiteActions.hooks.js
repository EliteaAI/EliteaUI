import { useCallback, useMemo, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import { useDeleteEvalSuiteMutation, useUpdateEvalSuiteMutation } from '../../api';
import { parseEvalError, suiteCreatedMessage, suiteDeletedMessage } from '../helpers';

export const useEvalSuiteActions = ({ projectId, agentId, tab, editingSuiteId }) => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { toastError, toastSuccess } = useToast();

  const isDetailView = editingSuiteId !== null;

  const [updateEvalSuite, { isLoading: isUpdating }] = useUpdateEvalSuiteMutation();
  const [deleteEvalSuite] = useDeleteEvalSuiteMutation();

  const [suiteToDelete, setSuiteToDelete] = useState(null);
  const [showCreateSuiteModal, setShowCreateSuiteModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const blockOptions = useMemo(() => ({ blockCondition: isDetailView && isDirty }), [isDetailView, isDirty]);
  const { setBlockNav } = useNavBlocker(blockOptions);

  const baseEvaluatePath = RouteDefinitions.ApplicationsEvaluate.replace(':tab', tab).replace(
    ':agentId',
    agentId,
  );

  const persistentSearch = NavigationHelpers.pickPersistentSearch(search);

  const handleNewSuite = useCallback(() => {
    setShowCreateSuiteModal(true);
  }, []);

  const handleCloseCreateSuiteModal = useCallback(() => {
    setShowCreateSuiteModal(false);
  }, []);

  // A suite exists the moment the create modal saves, so the detail form opens on a real
  // record — datasets and dimensions attach straight away with no draft state to flush.
  const handleSuiteCreated = useCallback(
    created => {
      if (!created?.id) return;
      toastSuccess(suiteCreatedMessage(created.name));
      navigate({ pathname: `${baseEvaluatePath}/${created.id}`, search: persistentSearch });
    },
    [navigate, baseEvaluatePath, persistentSearch, toastSuccess],
  );

  const handleSelectSuite = useCallback(
    suite => {
      navigate({ pathname: `${baseEvaluatePath}/${suite.id}`, search: persistentSearch });
    },
    [navigate, baseEvaluatePath, persistentSearch],
  );

  const handleBack = useCallback(() => {
    navigate({ pathname: baseEvaluatePath, search: persistentSearch });
  }, [navigate, baseEvaluatePath, persistentSearch]);

  const handleDirtyChange = useCallback(dirty => {
    setIsDirty(dirty);
  }, []);

  const handleSave = useCallback(
    async formData => {
      if (editingSuiteId == null) return;
      try {
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
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to save the suite.'));
      }
    },
    [editingSuiteId, updateEvalSuite, projectId, setBlockNav, toastSuccess, toastError],
  );

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
      toastSuccess(suiteDeletedMessage(suiteName));
      if (editingSuiteId === deletedId) {
        setBlockNav(false);
        navigate({ pathname: baseEvaluatePath, search: persistentSearch }, { replace: true });
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
    persistentSearch,
    setBlockNav,
    toastError,
    toastSuccess,
  ]);

  return {
    isDetailView,
    isSaving: isUpdating,
    suiteToDelete,
    showCreateSuiteModal,
    baseEvaluatePath,
    handleNewSuite,
    handleCloseCreateSuiteModal,
    handleSuiteCreated,
    handleSelectSuite,
    handleBack,
    handleDirtyChange,
    handleSave,
    handleDeleteSuite,
    handleCloseDelete,
    handleConfirmDelete,
  };
};
