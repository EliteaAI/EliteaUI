import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { PipelineLayoutHelpers } from '@/[fsd]/shared/lib/helpers';
import { useIsFrom } from '@/[fsd]/shared/lib/hooks/useIsFrom.hooks';
import { useIsFromPipelineDetail } from '@/[fsd]/shared/lib/hooks/useIsFromPipelineDetail.hooks';
import RouteDefinitions from '@/routes';
import { initialPipelineState, selectActivePipeline } from '@/slices/pipeline';

/** Arrange, a new orientation or a moved node: a change to save, though the YAML is the same. */
export const useIsPipelineLayoutDirty = () => {
  const isFromPipelineDetail = useIsFromPipelineDetail();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const { orientation, initState } = useSelector(selectActivePipeline);
  const canvasNodes = useSelector(state => state.pipelineEditor.nodes);

  const isLayoutDirty = useMemo(
    () =>
      (orientation || initialPipelineState.orientation) !==
        (initState.orientation || initialPipelineState.orientation) ||
      PipelineLayoutHelpers.hasLayoutChanged(canvasNodes, initState.nodes),
    [canvasNodes, initState.nodes, initState.orientation, orientation],
  );

  return (isFromPipelineDetail || isFromChat) && isLayoutDirty;
};
