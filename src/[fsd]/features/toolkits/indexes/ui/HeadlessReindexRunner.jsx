import { memo, useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import { useMcpAuthModal } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import { useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';

const HeadlessReindexRunner = memo(props => {
  const { index, toolkitId, traceNewIndex, refetchIndexesList, onDone } = props;

  const { values } = useFormikContext();
  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({ values });

  const { handleIndexData, isRunning, isIndexing } = useToolkitChat({
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
    onMcpAuthRequired: handleMcpAuthRequired,
  });

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
