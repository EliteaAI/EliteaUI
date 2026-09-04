import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import { useAddEvalBindingMutation, useDeleteEvalBindingMutation } from '../../api';
import { parseEvalError } from '../helpers';

export const useEvalDimensionActions = ({
  projectId,
  editingSuiteId,
  dimensions,
  attachedDimensions,
  agentId,
  tab,
}) => {
  const navigate = useNavigate();
  const { toastError, toastSuccess } = useToast();

  const [addEvalBinding] = useAddEvalBindingMutation();
  const [deleteEvalBinding] = useDeleteEvalBindingMutation();

  const [showDimensionLibrary, setShowDimensionLibrary] = useState(false);
  const [showCreateDimensionModal, setShowCreateDimensionModal] = useState(false);
  const [showBuildDimensionWithAi, setShowBuildDimensionWithAi] = useState(false);
  const [dimensionToRemove, setDimensionToRemove] = useState(null);
  const [dimensionToEdit, setDimensionToEdit] = useState(null);
  const [pendingDimensions, setPendingDimensions] = useState([]);

  useEffect(() => {
    setShowDimensionLibrary(false);
    setShowCreateDimensionModal(false);
    setShowBuildDimensionWithAi(false);
    setDimensionToRemove(null);
    setDimensionToEdit(null);
    setPendingDimensions([]);
  }, [editingSuiteId]);

  const handleManageDimensions = useCallback(() => {
    const dimensionsPath = RouteDefinitions.ApplicationsEvaluateDimensions.replace(':tab', tab).replace(
      ':agentId',
      agentId,
    );
    navigate(dimensionsPath);
  }, [navigate, tab, agentId]);

  const handleSelectDimensionFromLibrary = useCallback(() => {
    setShowDimensionLibrary(true);
  }, []);

  const handleCloseDimensionLibrary = useCallback(() => {
    setShowDimensionLibrary(false);
  }, []);

  const handleAddDimensionsFromLibrary = useCallback(
    async selected => {
      if (selected.length === 0) return;
      if (!editingSuiteId) {
        setPendingDimensions(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = selected
            .filter(d => !existingIds.has(d.id))
            .map(d => ({ id: d.id, engine: d.allowed_engines?.[0] ?? 'ai' }));
          return [...prev, ...newItems];
        });
        setShowDimensionLibrary(false);
        toastSuccess(`${selected.length} dimension${selected.length === 1 ? '' : 's'} added to the suite.`);
        return;
      }
      const results = await Promise.allSettled(
        selected.map(dimension =>
          addEvalBinding({
            projectId,
            suiteId: editingSuiteId,
            body: {
              dimension_id: dimension.id,
              engine: dimension.allowed_engines?.[0] ?? 'ai',
            },
          }).unwrap(),
        ),
      );
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      if (failCount === 0) {
        toastSuccess(`${successCount} dimension${successCount === 1 ? '' : 's'} added to the suite.`);
      } else {
        toastError(`${successCount} added, ${failCount} failed to attach.`);
      }
    },
    [editingSuiteId, addEvalBinding, projectId, toastSuccess, toastError],
  );

  const handleCreateDimensionManually = useCallback(() => {
    setShowCreateDimensionModal(true);
  }, []);

  const handleCloseCreateDimensionModal = useCallback(() => {
    setShowCreateDimensionModal(false);
  }, []);

  const handleDimensionCreated = useCallback(
    async (dimension, evidenceScope, engine) => {
      if (!dimension?.id) return;
      if (!editingSuiteId) {
        setPendingDimensions(prev => [...prev, { id: dimension.id, engine, evidenceScope }]);
        toastSuccess(`Dimension "${dimension.name}" has been created and added to the suite.`);
        return;
      }
      try {
        await addEvalBinding({
          projectId,
          suiteId: editingSuiteId,
          body: {
            dimension_id: dimension.id,
            evidence_scope: evidenceScope,
            engine,
          },
        }).unwrap();
        toastSuccess(`Dimension "${dimension.name}" has been created and added to the suite.`);
      } catch (error) {
        toastError(parseEvalError(error, 'Dimension created but failed to attach to suite.'));
      }
    },
    [editingSuiteId, addEvalBinding, projectId, toastSuccess, toastError],
  );

  const handleBuildDimensionWithAi = useCallback(() => {
    setShowBuildDimensionWithAi(true);
  }, []);

  const handleCloseBuildDimensionWithAi = useCallback(() => {
    setShowBuildDimensionWithAi(false);
  }, []);

  const handleEditDimension = useCallback(
    binding => {
      const dim = dimensions.find(d => d.id === binding.dimension_id);
      if (dim) {
        setDimensionToEdit(dim);
      }
    },
    [dimensions],
  );

  const handleCloseEditDimension = useCallback(() => {
    setDimensionToEdit(null);
  }, []);

  const handleDimensionUpdated = useCallback(() => {
    toastSuccess('Dimension has been updated successfully.');
  }, [toastSuccess]);

  const handleRemoveDimension = useCallback(
    binding => {
      const dim = attachedDimensions.find(d => d.binding.id === binding.id);
      setDimensionToRemove({ binding, name: dim?.name || `Dimension #${binding.dimension_id}` });
    },
    [attachedDimensions],
  );

  const handleCloseRemoveDimension = useCallback(() => {
    setDimensionToRemove(null);
  }, []);

  const handleConfirmRemoveDimension = useCallback(async () => {
    if (!dimensionToRemove?.binding) return;
    if (!editingSuiteId) {
      setPendingDimensions(prev => prev.filter(p => p.id !== dimensionToRemove.binding.dimension_id));
      setDimensionToRemove(null);
      return;
    }
    if (!dimensionToRemove.binding.id) return;
    try {
      await deleteEvalBinding({
        projectId,
        suiteId: editingSuiteId,
        bindingId: dimensionToRemove.binding.id,
      }).unwrap();
      toastSuccess('Dimension has been removed from the suite.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to remove dimension from the suite.'));
    }
    setDimensionToRemove(null);
  }, [editingSuiteId, dimensionToRemove, deleteEvalBinding, projectId, toastSuccess, toastError]);

  const flushPendingDimensions = useCallback(
    async suiteId => {
      if (pendingDimensions.length === 0) return;
      const results = await Promise.allSettled(
        pendingDimensions.map(dim =>
          addEvalBinding({
            projectId,
            suiteId,
            body: {
              dimension_id: dim.id,
              engine: dim.engine ?? 'ai',
              ...(dim.evidenceScope ? { evidence_scope: dim.evidenceScope } : {}),
            },
          }).unwrap(),
        ),
      );
      const failCount = results.filter(r => r.status === 'rejected').length;
      if (failCount > 0) {
        toastError(`${failCount} dimension${failCount === 1 ? '' : 's'} failed to attach.`);
      }
      setPendingDimensions([]);
    },
    [pendingDimensions, addEvalBinding, projectId, toastError],
  );

  return {
    showDimensionLibrary,
    showCreateDimensionModal,
    showBuildDimensionWithAi,
    dimensionToRemove,
    dimensionToEdit,
    pendingDimensions,
    handleManageDimensions,
    handleSelectDimensionFromLibrary,
    handleCloseDimensionLibrary,
    handleAddDimensionsFromLibrary,
    handleCreateDimensionManually,
    handleCloseCreateDimensionModal,
    handleDimensionCreated,
    handleBuildDimensionWithAi,
    handleCloseBuildDimensionWithAi,
    handleEditDimension,
    handleCloseEditDimension,
    handleDimensionUpdated,
    handleRemoveDimension,
    handleCloseRemoveDimension,
    handleConfirmRemoveDimension,
    flushPendingDimensions,
  };
};
