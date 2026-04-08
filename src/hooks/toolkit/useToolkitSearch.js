import { useCallback, useMemo } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useTheme } from '@mui/material';

import { McpConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useGroupedCategories } from '@/[fsd]/shared/lib/hooks';
import { getToolIcon } from '@/common/toolkitUtils';
import RouteDefinitions from '@/routes.js';

export const useToolkitSearch = ({
  toolMenuItems,
  isMCP = false,
  isApplication = false,
  disableNavigation = false,
} = {}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { toolkitType } = useParams();
  const [searchParams] = useSearchParams();

  // Get toolkit schemas from backend for category extraction
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  // Helper function to get category for a toolkit based on backend metadata
  const getCategoryForToolkit = useCallback(
    toolkit => {
      if (!isMCP) {
        // First check if we have backend metadata for this toolkit
        if (toolkitSchemas && toolkitSchemas[toolkit.key]) {
          const categories = toolkitSchemas[toolkit.key]?.metadata?.categories;
          if (categories && categories.length > 0) {
            // Capitalize each word in category name
            const category = categories[0];
            return category
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          }
        }
        // Default to 'Other' for toolkits without explicit categories
        return 'Other';
      } else {
        return toolkit.key === 'mcp' ? McpConstants.McpCategory.Remote : McpConstants.McpCategory.Local;
      }
    },
    [isMCP, toolkitSchemas],
  );

  // Process children to add icons and categories
  const processedChildren = useMemo(
    () =>
      toolMenuItems?.map(child => ({
        ...child,
        icon: child.icon || getToolIcon(child.key, theme),
      })) || [],
    [toolMenuItems, theme],
  );

  // Handle toolkit selection
  const handleItemSelect = useCallback(
    toolkit => {
      const newSearchParams = new URLSearchParams(searchParams);

      // Only navigate if navigation is not disabled (e.g., in chat context)
      if (!disableNavigation && toolkitType !== toolkit.key) {
        let pathname;
        if (isApplication) {
          pathname = RouteDefinitions.CreateAppType.replace(':appType', toolkit.key);
        } else if (isMCP) {
          pathname = RouteDefinitions.CreateMCPType.replace(':mcpType', toolkit.key);
        } else {
          pathname = RouteDefinitions.CreateToolkitType.replace(':toolkitType', toolkit.key);
        }
        navigate({
          pathname,
          search: newSearchParams.toString(),
        });
      }

      if (toolkit.onClick) {
        toolkit.onClick();
      }
    },
    [searchParams, toolkitType, navigate, isMCP, isApplication, disableNavigation],
  );

  const localGroupForMCP = useMemo(
    () =>
      !isMCP || toolMenuItems.filter(item => item.label !== 'Remote MCP').length > 0 ? undefined : 'Local',
    [isMCP, toolMenuItems],
  );

  // Use the generic search menu hook
  const searchMenuProps = useGroupedCategories(
    processedChildren,
    getCategoryForToolkit,
    handleItemSelect,
    localGroupForMCP,
  );
  return {
    ...searchMenuProps,
  };
};
