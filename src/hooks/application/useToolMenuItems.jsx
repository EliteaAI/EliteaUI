import { useMemo } from 'react';

import { useTheme } from '@mui/material';

import { useGetCurrentMCPSchemas, useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { getToolIconByType } from '@/common/toolkitUtils';
import JsonIcon from '@/components/Icons/JsonIcon.jsx';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts.js';

const useToolMenuItems = ({ onAddTool, isMCP, isApplication } = {}) => {
  const theme = useTheme();

  const { toolkitSchemas, isFetching: isFetchingToolkitTypes } = useGetCurrentToolkitSchemas({ isMCP });
  const { mcpSchemas, isFetching: isFetchingMcpSchemas } = useGetCurrentMCPSchemas({ isMCP });
  const toolSchemas = useMemo(
    () =>
      isMCP
        ? Object.keys(toolkitSchemas).find(key => key.toLowerCase() === 'mcp')
          ? {
              ...mcpSchemas,
              mcp: {
                ...toolkitSchemas[Object.keys(toolkitSchemas).find(key => key.toLowerCase() === 'mcp')],
                metadata: {
                  ...toolkitSchemas[Object.keys(toolkitSchemas).find(key => key.toLowerCase() === 'mcp')]
                    .metadata,
                  label: 'Remote MCP',
                },
              },
            }
          : mcpSchemas
        : Object.keys(toolkitSchemas)
            .filter(
              key =>
                key.toLowerCase() !== 'mcp' &&
                toolkitSchemas[key].type !== 'mcp' &&
                !key.toLowerCase().endsWith('mcp'),
            )
            .reduce((obj, key) => ({ ...obj, [key]: toolkitSchemas[key] }), {}),
    [isMCP, mcpSchemas, toolkitSchemas],
  );
  const toolkitsItems = useMemo(() => {
    return Object.entries(toolSchemas || {})
      .filter(([key, value]) => {
        // Filter out hidden toolkits and non-configurable toolkit types
        const keyLower = key.toLowerCase();
        const labelLower = value?.metadata?.label ? value.metadata.label.toLowerCase() : '';

        // Filter out internal tools by checking categories
        const categories = value?.metadata?.categories || [];
        const isInternalTool = categories.includes('internal_tool');

        // Filter based on isApplication prop
        const isAppType = value?.metadata?.application === true;
        const shouldInclude = isApplication ? isAppType : !isAppType;

        return (
          !value?.metadata?.hidden &&
          !['agent', 'datasource', 'application'].includes(keyLower) &&
          !['agent', 'datasource', 'application'].includes(labelLower) &&
          !isInternalTool &&
          shouldInclude
        );
      })
      .map(([key, value]) => {
        // FE label overrides take precedence over backend metadata
        const overrideLabel = ToolTypes[key]?.label;
        return {
          key,
          label: overrideLabel ?? value?.metadata?.label ?? '',
          icon: getToolIconByType(key, theme, { toolSchema: value, isMCP }),
          onClick: onAddTool ? onAddTool(key, toolSchemas) : () => {},
        };
      });
  }, [isMCP, onAddTool, theme, toolSchemas, isApplication]);

  const toolMenuItems = useMemo(() => {
    if (!toolkitsItems || toolkitsItems.length === 0) {
      return [];
    }
    const iconProps = {
      // htmlColor: theme.palette.icon.fill.default,
      color: 'secondary',
      fill: theme.palette.icon.fill.default,
      width: '16px',
      height: '16px',
      fontSize: '16px',
    };
    // Don't include Custom for applications (isApplication=true)
    const predefinedItems =
      !isMCP && !isApplication
        ? [
            {
              key: ToolTypes.custom.value,
              label: ToolTypes.custom.label,
              icon: <JsonIcon {...iconProps} />,
              onClick: onAddTool ? onAddTool(ToolTypes.custom.value, toolSchemas) : () => {},
            },
          ]
        : [];

    const itemsSet = new Set();

    predefinedItems.forEach(obj => {
      itemsSet.add(obj.key);
    });

    toolkitsItems.forEach(obj => {
      if (!!obj.label && !itemsSet.has(obj.key)) {
        predefinedItems.push(obj);
      }
    });

    return predefinedItems.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  }, [toolkitsItems, theme.palette.icon.fill.default, isMCP, isApplication, onAddTool, toolSchemas]);

  return {
    toolMenuItems,
    isFetchingToolkitTypes: !isMCP ? isFetchingToolkitTypes : isFetchingMcpSchemas,
  };
};

export default useToolMenuItems;
