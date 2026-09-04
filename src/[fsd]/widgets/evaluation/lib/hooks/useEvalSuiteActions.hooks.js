import { useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import {
  useCreateEvalSuiteMutation,
  useDeleteEvalSuiteMutation,
  useUpdateEvalSuiteMutation,
} from '../../api';
import { parseEvalError } from '../helpers';

export const useEvalSuiteActions = ({
  projectId,
  applicationId,
  agentId,
  tab,
  isCreatingNew,
  editingSuiteId,
  afterCreateRef,
}) => {
  const navigate = useNavigate();
  const { toastError, toastSuccess } = useToast();

  const isDetailView = isCreatingNew || editingSuiteId !== null;

  const [createEvalSuite, { isLoading: isCreating }] = useCreateEvalSuiteMutation();
  const [updateEvalSuite, { isLoading: isUpdating }] = useUpdateEvalSuiteMutation();
  const [deleteEvalSuite] = useDeleteEvalSuiteMutation();

  const [suiteToDelete, setSuiteToDelete] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const blockOptions = useMemo(() => ({ blockCondition: isDetailView && isDirty }), [isDetailView, isDirty]);
  const { setBlockNav } = useNavBlocker(blockOptions);

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
          const created = await createEvalSuite({
            projectId,
            body: {
              application_id: applicationId,
              name: formData.name,
              description: formData.description,
              judge_model: formData.judge_model,
            },
          }).unwrap();
          if (afterCreateRef?.current) {
            await afterCreateRef.current(created.id);
          }
          setBlockNav(false);
          toastSuccess(`The "${formData.name}" suite has been successfully created.`);
          navigate(`${baseEvaluatePath}/${created.id}`, { replace: true });
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
      afterCreateRef,
    ],
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

  return {
    isDetailView,
    isSaving: isCreating || isUpdating,
    suiteToDelete,
    baseEvaluatePath,
    handleNewSuite,
    handleSelectSuite,
    handleBack,
    handleDirtyChange,
    handleSave,
    handleDeleteSuite,
    handleCloseDelete,
    handleConfirmDelete,
  };
};
