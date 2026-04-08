import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatParticipantType } from '@/common/constants';
import useNavBlocker from '@/hooks/useNavBlocker';

/**
 * Hook for managing pipeline editor state and operations
 * Similar to useEditAgent but for pipelines
 */
const useEditPipeline = () => {
  // Get pipeline editing state from Redux via the navigation blocker
  const { isEditingPipeline, setPipelineEditingBlockNav } = useNavBlocker();
  const setPipelineEditingBlockNavRef = useRef(setPipelineEditingBlockNav);

  useEffect(() => {
    setPipelineEditingBlockNavRef.current = setPipelineEditingBlockNav;
  }, [setPipelineEditingBlockNav]);

  // Store the pipeline currently being edited (keep this as local state)
  const [editingPipeline, setEditingPipeline] = useState(null);
  // Store whether we're in create mode
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Split panel sizing state (similar to useEditCanvas)
  const [sizes, setSizes] = useState([50, 50]);

  const onDragEnd = useCallback(newSizes => setSizes(newSizes), []);

  const gutterStyle = useCallback(
    () => ({
      cursor: 'col-resize',
      pointerEvents: 'auto',
    }),
    [],
  );

  const onShowPipelineEditor = useCallback(pipeline => {
    if (!pipeline) return;

    setEditingPipeline(pipeline);
    setPipelineEditingBlockNavRef.current(true);
    setIsCreateMode(false);
    setSizes([50, 50]); // Set to 50/50 split when opening editor
  }, []);

  const onShowPipelineEditorCreator = useCallback(() => {
    setEditingPipeline(null);
    setPipelineEditingBlockNavRef.current(true);
    setIsCreateMode(true);
    setSizes([50, 50]); // Set to 50/50 split when opening editor
  }, []);

  const onClosePipelineEditor = useCallback(() => {
    setPipelineEditingBlockNavRef.current(false);
    setEditingPipeline(null);
    setIsCreateMode(false);
    setSizes([100, 0]); // Reset to full width when closing
  }, []);

  const onPipelineEditorCreated = useCallback(createdPipeline => {
    if (createdPipeline) {
      // Update the editing pipeline with the created one
      setEditingPipeline({
        ...createdPipeline,
        participantType: ChatParticipantType.Pipelines,
      });
      setIsCreateMode(false);
    }
  }, []);

  const handlePipelineSaved = useCallback(
    (savedPipeline, onChangeParticipantSettings) => {
      if (savedPipeline && onChangeParticipantSettings) {
        // Update the participant in the conversation
        onChangeParticipantSettings(editingPipeline, savedPipeline);

        // Update the editing pipeline state
        setEditingPipeline({
          ...savedPipeline,
          participantType: ChatParticipantType.Pipelines,
        });
      }
    },
    [editingPipeline],
  );

  useEffect(() => {
    return () => {
      setPipelineEditingBlockNavRef.current(false);
    };
  }, []);

  return {
    // Use Redux state instead of local state
    isEditingPipeline,
    editingPipeline,
    isPipelineCreateMode: isCreateMode,
    onShowPipelineEditor,
    onShowPipelineEditorCreator,
    onClosePipelineEditor,
    onPipelineEditorCreated,
    handlePipelineSaved,
    // Split panel sizing
    sizes,
    onDragEnd,
    gutterStyle,
  };
};

export default useEditPipeline;
