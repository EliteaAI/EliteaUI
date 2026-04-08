import { useCallback, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { StateHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { actions as pipelineActions } from '@/slices/pipeline';

/**
 * Custom hook to manage state variable validation in Redux
 * Validates state variables and caches results in Redux for performance
 */
export const useStateValidation = states => {
  const dispatch = useDispatch();

  // Validate all state variables on mount and when states change
  useEffect(() => {
    if (!states) {
      dispatch(pipelineActions.clearStateValidationErrors());
      return;
    }

    Object.entries(states).forEach(([name, config]) => {
      // Skip default props that don't need validation
      if (FlowEditorConstants.StateDefaultProps.includes(name)) return;

      const type = config.type || 'str';
      const value = config.value;
      const validationError = StateHelpers.validateValueByType(type, value);

      dispatch(pipelineActions.setStateValidationError({ variableName: name, error: validationError }));
    });
  }, [states, dispatch]);

  const validateVariable = useCallback(
    (name, type, value) => {
      const validationError = StateHelpers.validateValueByType(type, value);
      dispatch(pipelineActions.setStateValidationError({ variableName: name, error: validationError }));
      return validationError;
    },
    [dispatch],
  );

  const clearValidationError = useCallback(
    name => {
      dispatch(pipelineActions.setStateValidationError({ variableName: name, error: null }));
    },
    [dispatch],
  );

  const clearAllValidationErrors = useCallback(() => {
    dispatch(pipelineActions.clearStateValidationErrors());
  }, [dispatch]);

  return {
    validateVariable,
    clearValidationError,
    clearAllValidationErrors,
  };
};
