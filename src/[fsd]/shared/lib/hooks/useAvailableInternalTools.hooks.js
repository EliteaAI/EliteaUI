import { useMemo } from 'react';

import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { InternalToolsConstants } from '@/[fsd]/shared/lib/constants';

/**
 * Hook that returns the list of available internal tools based on toolkit availability.
 * Filters out tools that require specific toolkit types that are not available.
 *
 * For example, 'image_generation' tool requires 'ImageGenServiceProvider_ImageGen' toolkit
 * to be available in the project's toolkit schemas.
 *
 * Uses cached toolkit schemas (2 min cache) to avoid unnecessary API calls.
 *
 * @param {Object} options - Optional configuration
 * @param {boolean} options.includeAgentOnly - Whether to include agent-only tools (default: false)
 * @returns {Array} List of available internal tools
 */
export const useAvailableInternalTools = (options = {}) => {
  const { includeAgentOnly = false } = options;
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  const availableTools = useMemo(() => {
    return InternalToolsConstants.INTERNAL_TOOLS_LIST.filter(tool => {
      // Filter out agent-only tools if not in agent context
      if (tool.agentOnly && !includeAgentOnly) {
        return false;
      }

      // If tool doesn't require a specific toolkit type, it's always available
      if (!tool.requiredToolkitType) {
        return true;
      }
      // Check if the required toolkit type exists in schemas
      return Boolean(toolkitSchemas?.[tool.requiredToolkitType]);
    });
  }, [toolkitSchemas, includeAgentOnly]);

  return availableTools;
};
