import { memo, useCallback, useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import { McpAuthModal, useMcpAuthModal } from '@/[fsd]/features/mcp';
import { useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';

const HeadlessReindexRunner = memo(props => {
  const { index, toolkitId, traceNewIndex, refetchIndexesList, onDone } = props;

  const { values } = useFormikContext();

  // Stable ref wrapper to break circular dependency between useToolkitChat and useMcpAuthModal.
  const mcpAuthRequiredRef = useRef(null);
  const onMcpAuthRequiredStable = useCallback(message => {
    mcpAuthRequiredRef.current?.(message);
  }, []);

  const { handleIndexData, isRunning, isIndexing, retryLastRun } = useToolkitChat({
    cancelIndexingCallback: null,
    index,
    isValidForm: true,
    refetchIndexesList,
    runTool: null,
    toolkitId,
    toolInputVariables: {},
    traceNewIndex,
    values,
    modes: [],
    onMcpAuthRequired: onMcpAuthRequiredStable,
  });

  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({
    values,
    onSuccess: retryLastRun,
    showSuccessToast: false,
  });

  // Wire stable wrapper to the real handler.
  mcpAuthRequiredRef.current = handleMcpAuthRequired;

  const startedRef = useRef(false);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    handleIndexData();
  }, [handleIndexData]);

  useEffect(() => {
    const active = isRunning || isIndexing;
    if (active) wasActiveRef.current = true;
    else if (wasActiveRef.current) onDone?.();
  }, [isRunning, isIndexing, onDone]);

  return <McpAuthModal {...getModalProps()} />;
});

HeadlessReindexRunner.displayName = 'HeadlessReindexRunner';

export default HeadlessReindexRunner;
