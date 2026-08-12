import { useMemo } from 'react';

import { InternalToolsConstants } from '@/[fsd]/shared/lib/constants';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';

import { useGetCurrentToolkitSchemas } from './useGetCurrentToolkitSchemas.hooks';

export const useAvailableInternalTools = (options = {}) => {
  const { includeAgentOnly = false } = options;
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const isMcpVisible = useIsMcpVisible();

  const availableTools = useMemo(() => {
    return InternalToolsConstants.INTERNAL_TOOLS_LIST.filter(tool => {
      if (tool.agentOnly && !includeAgentOnly) {
        return false;
      }

      if (tool.name === 'internal_mcp' && !isMcpVisible) {
        return false;
      }

      if (!tool.requiredToolkitType) {
        return true;
      }
      return Boolean(toolkitSchemas?.[tool.requiredToolkitType]);
    });
  }, [toolkitSchemas, includeAgentOnly, isMcpVisible]);

  return availableTools;
};
