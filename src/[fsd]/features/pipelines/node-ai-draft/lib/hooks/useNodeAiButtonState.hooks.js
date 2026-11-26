import { useContext, useMemo } from 'react';

import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { NodeAiModeHelpers } from '@/[fsd]/features/pipelines/node-ai-draft/lib/helpers';
import { useIsVersionLocked } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';

/** Visibility, mode and tooltip of the node panel sparkle button (spec AC-1…AC-6) */
export const useNodeAiButtonState = yamlNode => {
  const { disabled, isRunningPipeline } = useContext(FlowEditorContext);
  const isVersionLocked = useIsVersionLocked();
  const llmSettings = useNodeAiAssistantConfig();

  return useMemo(
    () =>
      NodeAiModeHelpers.getNodeAiButtonState({
        yamlNode,
        disabled,
        isRunningPipeline,
        isVersionLocked,
        llmSettings,
      }),
    [yamlNode, disabled, isRunningPipeline, isVersionLocked, llmSettings],
  );
};
