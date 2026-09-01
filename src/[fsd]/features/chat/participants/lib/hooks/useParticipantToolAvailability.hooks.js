import { useMemo } from 'react';

import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits';
import { ChatParticipantType } from '@/common/constants';

export const useParticipantToolAvailability = ({ originalDetails, type }) => {
  const { getSelectedTools } = useGetToolkitNameFromSchema();

  const someToolsAreUnavailable = useMemo(() => {
    if (type !== ChatParticipantType.Applications && type !== ChatParticipantType.Pipelines) {
      return false;
    }
    return !!originalDetails?.version_details?.tools?.find(tool => {
      const availableTools = getSelectedTools(tool?.type);
      return (
        !!availableTools?.length &&
        tool?.settings?.selected_tools?.some(item => !availableTools.includes(item))
      );
    });
  }, [getSelectedTools, originalDetails?.version_details?.tools, type]);

  // Toolkit TYPE labels blocked by org guardrails (deduped).
  // Absent from schema catalog so someToolsAreUnavailable cannot detect them.
  const blockedToolkitNames = useMemo(() => {
    if (type !== ChatParticipantType.Applications && type !== ChatParticipantType.Pipelines) {
      return [];
    }
    const labels = (originalDetails?.version_details?.tools || [])
      .filter(tool => tool?.type !== 'application' && ToolkitsHelpers.isToolkitTypeBlocked(tool?.type))
      .map(tool => ToolkitsHelpers.getToolkitTypeLabel(tool?.type));
    return [...new Set(labels)];
  }, [originalDetails?.version_details?.tools, type]);

  return { someToolsAreUnavailable, blockedToolkitNames };
};
