import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useToolkitAvailableToolsQuery } from '@/api/toolkits.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useGetSelectedToolSchema = ({ toolkitType, toolOptionType, toolkitId, availableMcpTools }) => {
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const projectId = useSelectedProjectId();

  const hasToolkitTypeSchema = !!toolkitSchemas?.[toolkitType];
  const staticToolSchema =
    toolkitSchemas?.[toolkitType]?.properties?.selected_tools?.args_schemas?.[toolOptionType];

  // MCP tools have schemas pre-loaded in settings
  const mcpToolSchema = availableMcpTools?.find(it => it.value === toolOptionType)?.args_schema;

  // Only fetch dynamically for OpenAPI-like toolkits that don't have static or MCP schemas
  const shouldFetchDynamic =
    !!toolOptionType &&
    hasToolkitTypeSchema &&
    !staticToolSchema &&
    !mcpToolSchema &&
    !!projectId &&
    !!toolkitId;

  const { data: dynamicToolsData } = useToolkitAvailableToolsQuery(
    { projectId, toolkitId },
    { skip: !shouldFetchDynamic },
  );

  // Priority: static schema > MCP schema > dynamic fetched schema
  const toolSchema =
    !toolOptionType || !hasToolkitTypeSchema
      ? null
      : staticToolSchema || mcpToolSchema || dynamicToolsData?.args_schemas?.[toolOptionType] || null;

  if (!toolSchema) return null;

  if (toolSchema.inputSchema) {
    return {
      properties: toolSchema.inputSchema.properties || {},
      required: toolSchema.inputSchema.required || [],
      title: toolSchema.title || toolSchema.name,
      description: toolSchema.description,
      type: 'object',
    };
  }

  return toolSchema;
};
