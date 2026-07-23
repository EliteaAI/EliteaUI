import { useMemo } from 'react';

import { useFormikContext } from 'formik';

import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks/useGetCurrentToolkitSchemas.hooks';
import { useToolkitAvailableToolsQuery } from '@/api/toolkits.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useToolkitToolOptions = ({ toolkitId }) => {
  const { values } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const selectedToolsSchema = toolkitSchemas?.[values?.type]?.properties?.selected_tools;

  const schemaToolNames = useMemo(() => {
    const argsSchemasKeys = Object.keys(selectedToolsSchema?.args_schemas || {});
    if (argsSchemasKeys.length) return argsSchemasKeys;
    return [...(selectedToolsSchema?.items?.enum || [])];
  }, [selectedToolsSchema?.args_schemas, selectedToolsSchema?.items?.enum]);

  const shouldFetchDynamicTools = useMemo(() => {
    if (!projectId || !toolkitId) return false;
    if (schemaToolNames.length) return false;
    return true;
  }, [projectId, schemaToolNames.length, toolkitId]);

  const { data: toolkitAvailableToolsData } = useToolkitAvailableToolsQuery(
    { projectId, toolkitId },
    { skip: !shouldFetchDynamicTools },
  );

  const dynamicToolNames = useMemo(() => {
    const tools = toolkitAvailableToolsData?.tools || [];
    return tools.map(t => t?.name).filter(name => typeof name === 'string' && name.trim());
  }, [toolkitAvailableToolsData?.tools]);

  const allToolsOptions = useMemo(() => {
    const explicitSelectedTools = values?.settings?.selected_tools || [];
    const hasExplicitSelection = Array.isArray(explicitSelectedTools) && explicitSelectedTools.length > 0;
    const availableTools = hasExplicitSelection
      ? explicitSelectedTools
      : dynamicToolNames.length
        ? dynamicToolNames
        : schemaToolNames;

    const indexToolNames = new Set(Object.values(IndexesToolsEnum));

    return (availableTools || [])
      .filter(tool => {
        const name = typeof tool === 'string' ? tool : tool?.name;
        return !indexToolNames.has(name);
      })
      .map(tool => ({
        label:
          typeof tool === 'string'
            ? (tool.charAt(0).toUpperCase() + tool.slice(1)).replaceAll('_', ' ')
            : tool?.name,
        value: tool,
      }))
      .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
  }, [dynamicToolNames, schemaToolNames, values?.settings?.selected_tools]);

  return { allToolsOptions };
};
