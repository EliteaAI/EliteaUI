import { useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { actions as settingsActions } from '@/slices/settings';

export default function useNavBlocker(options) {
  const dispatch = useDispatch();
  const {
    isBlockNav,
    isStreaming,
    isEditingCanvas,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingArtifact,
    isToolkitCreateMode,
    isResetApiState,
    warningMessage,
  } = useSelector(state => state.settings.navBlocker);

  // Derived state - calculated from individual editor states
  const isAnyEditorOpen = useMemo(
    () => isEditingCanvas || isEditingAgent || isEditingToolkit || isEditingPipeline || isEditingArtifact,
    [isEditingCanvas, isEditingAgent, isEditingToolkit, isEditingPipeline, isEditingArtifact],
  );

  const resetApiState = useCallback(() => {
    // dispatch(collectionApi.util.resetApiState());
    // dispatch(promptApi.util.resetApiState());
    // dispatch(searchActions.resetQuery())

    /* eslint-disable-next-line no-console */
    console.debug('resetApiState is no longer happening');
  }, []);

  const setBlockNav = useCallback(
    value => {
      dispatch(settingsActions.setBlockNav(value));
    },
    [dispatch],
  );
  const setStreamingBlockNav = useCallback(
    (streaming, streamingType) => {
      dispatch(settingsActions.setStreamingBlockNav({ isStreaming: streaming, streamingType }));
    },
    [dispatch],
  );
  const setEditingCanvasBlockNav = useCallback(
    isEditing => {
      dispatch(settingsActions.setEditingCanvasBlockNav({ isEditingCanvas: isEditing }));
    },
    [dispatch],
  );
  const setAgentEditingBlockNav = useCallback(
    value => {
      dispatch(settingsActions.setAgentEditingBlockNav(value));
    },
    [dispatch],
  );
  const setToolkitEditingBlockNav = useCallback(
    value => {
      dispatch(settingsActions.setToolkitEditingBlockNav(value));
    },
    [dispatch],
  );
  const setPipelineEditingBlockNav = useCallback(
    value => {
      dispatch(settingsActions.setPipelineEditingBlockNav(value));
    },
    [dispatch],
  );
  const setArtifactEditingBlockNav = useCallback(
    value => {
      dispatch(settingsActions.setArtifactEditingBlockNav(value));
    },
    [dispatch],
  );
  const setToolkitCreateMode = useCallback(
    value => {
      dispatch(settingsActions.setToolkitCreateMode(value));
    },
    [dispatch],
  );
  const setIsResetApiState = useCallback(
    value => {
      dispatch(settingsActions.setIsResetApiState(value));
    },
    [dispatch],
  );

  useEffect(() => {
    if (options) {
      setBlockNav(options?.blockCondition);
    }
  }, [options, setBlockNav]);

  return {
    isBlockNav,
    isStreaming,
    isEditingCanvas,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingArtifact,
    isToolkitCreateMode,
    isAnyEditorOpen,
    warningMessage,
    isResetApiState,
    setBlockNav,
    setStreamingBlockNav,
    setEditingCanvasBlockNav,
    setAgentEditingBlockNav,
    setToolkitEditingBlockNav,
    setPipelineEditingBlockNav,
    setArtifactEditingBlockNav,
    setToolkitCreateMode,
    setIsResetApiState,
    resetApiState,
  };
}
