import { deepClone } from '@mui/x-data-grid/internals';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

export const measureNodes = (nodes, zoom, editorRef) => {
  return nodes.map(node => {
    const nodeEl = editorRef.current?.querySelector(`[data-id="${node.id}"]`);
    if (!nodeEl) return node;

    const rect = nodeEl.getBoundingClientRect();
    return {
      ...node,
      measured: {
        width: Math.ceil(rect.width / zoom),
        height: Math.ceil(rect.height / zoom),
      },
    };
  });
};

export const convertNode = (node, layoutVersion) => {
  if (!layoutVersion) {
    return {
      ...node,
      ...node,
      measured: undefined,
      style: undefined,
    };
  }
  return node;
};

export const updateNode = (id, yamlJsonObject, setYamlJsonObject, updateCallback) => {
  const oldNodes = [...(yamlJsonObject?.nodes || [])];
  const index = oldNodes.findIndex(node => node.id === id);

  if (index !== -1) {
    const newNodes = [...oldNodes.filter(node => node.id !== id)];
    const updatedNode = updateCallback(oldNodes[index]);
    newNodes.splice(index, 0, updatedNode);
    setYamlJsonObject({
      ...(yamlJsonObject || {}),
      nodes: newNodes,
    });
  }
};

export const updateYamlNode = (id, field, value, yamlJsonObject, setYamlJsonObject) => {
  updateNode(id, yamlJsonObject, setYamlJsonObject, node => ({
    ...node,
    [field]: value,
  }));
};

export const batchUpdateYamlNode = (id, value = {}, yamlJsonObject, setYamlJsonObject, replace = false) => {
  updateNode(id, yamlJsonObject, setYamlJsonObject, node => ({
    ...(!replace ? node : {}),
    ...value,
  }));
};

export const updateYamlNodeInputMappingVariable = (
  id,
  variable,
  value,
  yamlJsonObject,
  setYamlJsonObject,
  dataType,
) => {
  const v = value;

  if (v.type === 'fixed') {
    if (dataType === 'integer' || dataType === 'number') {
      try {
        v.value = JSON.parse(v.value);
      } catch {
        /* do nothing */
      }
    } else if (dataType === 'boolean') {
      v.value = v.value === true || v.value === 'true';
    }
  }

  updateNode(id, yamlJsonObject, setYamlJsonObject, node => ({
    ...node,
    input_mapping: {
      ...(node.input_mapping || {}),
      [variable]: v,
    },
  }));
};

export const removeYamlNodeVariablesMapping = (id, output, yamlJsonObject, setYamlJsonObject) => {
  updateNode(id, yamlJsonObject, setYamlJsonObject, node => {
    const clonedVariablesMapping = deepClone(node.variables_mapping || {});
    delete clonedVariablesMapping[output];

    return {
      ...node,
      variables_mapping: {
        ...clonedVariablesMapping,
      },
    };
  });
};

/**
 * Creates default mapping for application toolkit
 */
const createApplicationMapping = (existingMapping, selectedToolkit) => {
  return {
    mapping: {
      task: { ...(existingMapping?.task || { type: 'fstring', value: '' }) },
      chat_history: { ...(existingMapping?.chat_history || { type: 'fixed', value: [], dataType: 'array' }) },
      ...(selectedToolkit?.variables?.reduce((result, variable) => {
        return {
          [variable.name]: {
            type: 'fixed',
            value: variable.value,
          },
          ...result,
        };
      }, {}) || {}),
    },
    mappingInfo: {
      task: {
        tooltip: 'Task for agent.',
        type: 'fstring',
        value: '',
        data_type: 'string',
      },
      chat_history: {
        tooltip:
          "Chat History relevant for agent. Array of messages, each with 'content' and 'type' fields. Example: [{'content': 'Hello', 'type': 'human'}, {'content': 'Hi there!', 'type': 'ai'}]",
        type: 'fixed',
        value: Object.keys(existingMapping || {}).includes('chat_history') ? [] : '', // if chat_history already exists in mapping, default to empty array, otherwise default to empty string in order not to confuse the user that chat_history is in the mapping when it's not
        data_type: 'array',
      },
      ...(selectedToolkit?.variables?.reduce((result, variable) => {
        return {
          [variable.name]: {
            tooltip: 'This is a variable from the agent',
            type: 'fixed',
            value: variable.value,
          },
          ...result,
        };
      }, {}) || {}),
    },
    defaultValues: {
      task: '',
      chat_history: [],
    },
  };
};

export const getInputMappingDefaultValue = (enumList, dataType, defaultValues, key) => {
  if (enumList?.length > 0) {
    return dataType !== 'array' ? enumList[0] : [];
  } else {
    return defaultValues[key] !== undefined ? defaultValues[key] : '';
  }
};

export const getEnumList = (type, schemaEnum, inputOptions) => {
  switch (type) {
    case 'fixed':
      return schemaEnum;
    case 'variable':
      return inputOptions.map(item => item.value);
    default:
      return [];
  }
};

/**
 * Creates default mapping for datasource toolkit
 */
const createDatasourceMapping = existingMapping => ({
  query: { ...(existingMapping?.query || { type: 'variable', value: '' }) },
});

/**
 * Gets appropriate default value based on property type
 * @param {Object} property - The property schema object with type and enum
 * @returns {*} Default value appropriate for the type
 */
const getDefaultValueForType = property => {
  const { type, enum: enumProp, items } = property;
  const enumValues = enumProp || items?.enum;

  // If enum values exist, use the first one as default
  if (enumValues?.length && type !== 'array') {
    return enumValues[0];
  }

  switch (type) {
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'integer':
    case 'number':
      return '';
    case 'string':
    default:
      return '';
  }
};

const getDataTypeOfMapping = value => {
  if (value.type) {
    return value.type;
  } else {
    if (value.anyOf) {
      const foundType = value.anyOf.find(v => v.type && v.type !== 'null')?.type;
      if (foundType) {
        return foundType;
      }
    }
  }
  return 'string';
};

const getEnumOfMapping = value => {
  if (value.enum) {
    return value.enum;
  } else if (value.items?.enum) {
    return value.items.enum;
  } else if (value.anyOf) {
    const foundEnum = value.anyOf.find(v => v.enum)?.enum;
    if (foundEnum?.length) {
      return foundEnum;
    }
  }
  return undefined;
};

const getMappingValue = (foundMapping, value, defaultValueForType) => {
  if (foundMapping) {
    return foundMapping.value;
  } else if (value.default !== undefined) {
    return value.default;
  } else {
    return defaultValueForType;
  }
};

export const getDefaultInputMappingOfTool = (
  toolkitSchemas,
  selectedTool,
  existingMapping,
  selectedToolkit,
  dynamicArgsSchemas = {},
) => {
  if (
    selectedToolkit?.type === ToolTypes.application.value ||
    selectedToolkit?.type === ToolTypes.datasource.value
  ) {
    switch (selectedToolkit?.type) {
      case ToolTypes.application.value: {
        const { mapping, mappingInfo, defaultValues } = createApplicationMapping(
          existingMapping,
          selectedToolkit,
        );
        return { mapping, mappingInfo, defaultValues };
      }
      case ToolTypes.datasource.value: {
        const mapping = createDatasourceMapping(existingMapping);
        return { mapping };
      }
      default:
        break;
    }
    return { mapping: {} };
  }

  // For Remote MCP tools, extract args_schema from available_mcp_tools
  let schemaForTool =
    dynamicArgsSchemas?.[selectedTool] ||
    toolkitSchemas?.[selectedToolkit?.type]?.properties?.selected_tools?.args_schemas?.[selectedTool];

  // Check if this is a Remote MCP tool with available_mcp_tools
  if (
    !schemaForTool &&
    (selectedToolkit?.meta?.mcp || selectedToolkit?.type === 'mcp') &&
    selectedToolkit?.settings?.available_mcp_tools
  ) {
    const mcpTool = selectedToolkit.settings.available_mcp_tools.find(
      tool => tool.value === selectedTool || tool.label === selectedTool,
    );
    if (mcpTool?.args_schema) {
      schemaForTool = mcpTool.args_schema;
    }
  }

  // For MCP tools, check both properties and inputSchema
  // MCP tools are identified by selectedToolkit.meta?.mcp flag
  const properties =
    selectedToolkit?.meta?.mcp || selectedToolkit?.type === 'mcp'
      ? schemaForTool?.properties || schemaForTool?.inputSchema?.properties || {}
      : schemaForTool?.properties || {};

  if (Object.entries(properties).length === 0 && selectedTool) {
    return {
      mapping: {
        ...existingMapping,
      },
      defaultValues: {},
    };
  }
  const mappingInfo = {};
  const mapping = Object.entries(properties).reduce((result, [key, value]) => {
    const foundMapping = existingMapping ? existingMapping[key] : undefined;
    const defaultValueForType = getDefaultValueForType(value);
    mappingInfo[key] = {
      enum: getEnumOfMapping(value),
      data_type: getDataTypeOfMapping(value),
      tooltip: value.description || '',
      type: 'fixed',
      value: getMappingValue(foundMapping, value, defaultValueForType),
      multiline: value.multiline === true,
    };
    return {
      [key]: foundMapping
        ? {
            ...foundMapping,
            enum: getEnumOfMapping(value),
          }
        : {
            type: 'fixed',
            value: value.default !== undefined ? value.default : defaultValueForType,
            enum: getEnumOfMapping(value),
          },
      ...result,
    };
  }, {});
  const defaultValues = Object.entries(properties).reduce((result, [key, value]) => {
    const defaultValueForType = getDefaultValueForType(value);
    return {
      [key]: value.default !== undefined ? value.default : defaultValueForType,
      ...result,
    };
  }, {});
  return { mapping, defaultValues, mappingInfo };
};

/**
 * Creates tooltips for application toolkit
 */
const createApplicationTooltips = selectedToolkit => {
  const tooltips = {
    task: 'Provides the main instruction or task for the agent being called.',
    chat_history: 'Defines how chat history is passed to the agent being called',
  };
  selectedToolkit?.settings?.variables?.forEach(variable => {
    tooltips[variable.name] = 'This is a variable from the agent';
  });
  return tooltips;
};

/**
 * Creates tooltips for datasource toolkit
 */
const createDatasourceTooltips = () => ({
  query: 'Defines the query to be executed against the datasource.',
});

export const getRequiredInputsAndTooltips = (
  toolkitTypes,
  selectedTool,
  selectedToolkit,
  dynamicArgsSchemas = {},
) => {
  if (
    selectedToolkit?.type === ToolTypes.application.value ||
    selectedToolkit?.type === ToolTypes.datasource.value
  ) {
    let tooltips = {};
    switch (selectedToolkit?.type) {
      case ToolTypes.application.value:
        tooltips = createApplicationTooltips(selectedToolkit);
        break;
      case ToolTypes.datasource.value:
        tooltips = createDatasourceTooltips();
        break;
      default:
        break;
    }

    return { required: [], tooltips, enums: {} };
  }

  let schemaForTool =
    dynamicArgsSchemas?.[selectedTool] ||
    toolkitTypes?.[selectedToolkit?.type]?.properties?.selected_tools?.args_schemas?.[selectedTool] ||
    {};

  // For Remote MCP tools, extract args_schema from available_mcp_tools
  if (
    !schemaForTool?.properties &&
    !schemaForTool?.inputSchema &&
    (selectedToolkit?.meta?.mcp || selectedToolkit?.type === 'mcp') &&
    selectedToolkit?.settings?.available_mcp_tools
  ) {
    const mcpTool = selectedToolkit.settings.available_mcp_tools.find(
      tool => tool.value === selectedTool || tool.label === selectedTool,
    );
    if (mcpTool?.args_schema) {
      schemaForTool = mcpTool.args_schema;
    }
  }

  const { required, inputSchema } = schemaForTool;
  return { required: required || inputSchema?.required || [] };
};

export const getNodeTypeFlags = (nodeId, sourceHandle, yamlNode) => ({
  isFromConditionNode: nodeId.endsWith(FlowEditorConstants.CONDITION_NODE_ID_SUFFIX) || yamlNode?.condition,
  isFromDecisionNode: nodeId.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX) || yamlNode?.decision,
  isFromRouterHandle: sourceHandle?.startsWith(FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX),
  isFromHitlHandle: sourceHandle?.startsWith(FlowEditorConstants.HITL_HANDLE_ID_SUFFIX),
});

export const getTargetNodeTypeFlags = node => ({
  isTargetConditionNode: node.id.endsWith(FlowEditorConstants.CONDITION_NODE_ID_SUFFIX),
  isTargetDecisionNode: node.id.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX),
  isTargetEndNode: node.id === FlowEditorConstants.PipelineNodeTypes.End,
});

/**
 * Checks if source is a special node type (condition, decision, or router)
 */
const isSpecialSourceNode = ({
  isFromConditionNode,
  isFromDecisionNode,
  isFromRouterHandle,
  isFromHitlHandle,
}) => {
  return isFromConditionNode || isFromDecisionNode || isFromRouterHandle || isFromHitlHandle;
};

/**
 * Checks if target is a special node type (condition or decision)
 */
const isSpecialTargetNode = ({ isTargetConditionNode, isTargetDecisionNode }) => {
  return isTargetConditionNode || isTargetDecisionNode;
};

export const canConnectToTarget = (sourceFlags, targetFlags, sourceYamlNode) => {
  const { isTargetEndNode } = targetFlags;

  // Special nodes cannot connect to other special nodes
  if (isSpecialSourceNode(sourceFlags) && isSpecialTargetNode(targetFlags)) {
    return false;
  }

  // To End nodes: only if source has no existing transition/condition/decision or transition = END
  if (isTargetEndNode && sourceYamlNode) {
    if (
      (sourceYamlNode.transition &&
        sourceYamlNode.transition !== FlowEditorConstants.PipelineNodeTypes.End) ||
      sourceYamlNode.condition ||
      sourceYamlNode.decision
    ) {
      return false;
    }
  }

  return true;
};

export const canCreateNodeType = (nodeType, sourceFlags) => {
  // Cannot create special node types (Condition/Decision) from special source nodes
  if (
    (nodeType === FlowEditorConstants.PipelineNodeTypes.Condition ||
      nodeType === FlowEditorConstants.PipelineNodeTypes.Decision) &&
    isSpecialSourceNode(sourceFlags)
  ) {
    return false;
  }

  return true;
};

export const getAllowedNodeTypes = () =>
  Object.keys(FlowEditorConstants.PipelineNodeTypes)
    .sort()
    .filter(
      key =>
        key !== FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.End] &&
        key !== FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Ghost] &&
        key !== FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Default] &&
        key !== FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Function],
    )
    .map(key => FlowEditorConstants.PipelineNodeTypes[key]);

export const getToolName = tool =>
  typeof tool === 'string' ? tool : tool.name || tool.description || tool.path;

export const calculatePositionForNewNode = (xStartPos, yStartPos, flowNodes) => {
  let xPos = xStartPos;
  let yPos = yStartPos;
  for (let index = 0; ; index++) {
    if (
      !flowNodes.find(
        node => Math.abs(node.position.x - xPos) < 0.01 && Math.abs(node.position.y - yPos) < 0.01,
      )
    ) {
      break;
    }
    xPos += 60;
    yPos += 60;
  }
  return {
    xPos,
    yPos,
  };
};

const getNormalInitialNodeId = (type, nodes = []) => {
  const filterNodeNames = nodes.map(node => node.id);
  for (let index = 0; ; index++) {
    const newId =
      (FlowEditorConstants.InitialNodeId[type] ||
        FlowEditorConstants.InitialNodeId[FlowEditorConstants.PipelineNodeTypes.Custom]) +
      ' ' +
      (index + 1);
    if (!filterNodeNames.find(id => id.replace(/\s/g, '') === newId.replace(/\s/g, ''))) {
      return newId;
    }
  }
};

export const getInitialNodeId = (type, nodes = []) => {
  return type !== FlowEditorConstants.PipelineNodeTypes.Condition
    ? getNormalInitialNodeId(type, nodes)
    : `Condition${new Date().getTime()}${FlowEditorConstants.CONDITION_NODE_ID_SUFFIX}`;
};

export const generateNodeIdByType = (type, nodes) => {
  return {
    id: getInitialNodeId(type, nodes),
    type,
    ...(FlowEditorConstants.InitialNodeData[type] || {}),
  };
};
