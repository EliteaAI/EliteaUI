import { useMemo } from 'react';

import { InternalToolsConstants } from '@/[fsd]/shared/lib/constants';
import { useIsMcpVisible, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

import { useGetCurrentToolkitSchemas } from './useGetCurrentToolkitSchemas.hooks';

const EMPTY_TOOL_NAMES = [];

export const useAvailableInternalTools = (options = {}) => {
  // activeToolNames: tools already on in this conversation/agent stay listed (inactive) when unavailable
  const { includeAgentOnly = false, activeToolNames = EMPTY_TOOL_NAMES } = options;
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const isMcpVisible = useIsMcpVisible();
  const projectId = useSelectedProjectId();
  const { data: platformSettings } = useGetPlatformSettingsQuery({ projectId }, { skip: !projectId });
  const isWebSearchAvailable = Boolean(platformSettings?.tool_spend?.web_search?.available);

  const availableTools = useMemo(() => {
    return InternalToolsConstants.INTERNAL_TOOLS_LIST.flatMap(tool => {
      if (tool.agentOnly && !includeAgentOnly) {
        return [];
      }

      if (['internal_mcp', 'skill_builder', 'project_context_builder'].includes(tool.name) && !isMcpVisible) {
        return [];
      }

      if (tool.requiresWebSearch && !isWebSearchAvailable) {
        return activeToolNames.includes(tool.name) ? [{ ...tool, unavailable: true }] : [];
      }

      if (!tool.requiredToolkitType) {
        return [tool];
      }
      return toolkitSchemas?.[tool.requiredToolkitType] ? [tool] : [];
    });
  }, [toolkitSchemas, includeAgentOnly, isMcpVisible, isWebSearchAvailable, activeToolNames]);

  return availableTools;
};
