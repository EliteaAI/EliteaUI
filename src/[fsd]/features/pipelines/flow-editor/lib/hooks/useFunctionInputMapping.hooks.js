import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useToolkitAvailableToolsQuery } from '@/api/toolkits.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { PipelineNodeTypes } from '../constants/flowEditor.constants';

export const useFunctionInputMapping = ({ id, isMCP }) => {
  const { setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);
  const { toolkitSchemas: toolkitTypes } = useGetCurrentToolkitSchemas({ isMCP });
  const projectId = useSelectedProjectId();
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const { values } = useFormikContext();
  const toolkit = useMemo(() => {
    if (
      !yamlNode?.toolkit_name &&
      !yamlNode?.tool &&
      yamlNode?.type !== PipelineNodeTypes.Agent &&
      yamlNode?.type !== PipelineNodeTypes.Toolkit &&
      yamlNode?.type !== PipelineNodeTypes.Mcp
    ) {
      return id; //This is for backward compatibility with nodes created before toolkit_name and tool were added to YAML. The node id was used as the toolkit identifier in that case
    } else if (!yamlNode?.toolkit_name) {
      return yamlNode?.tool;
    } else {
      return yamlNode?.toolkit_name;
    }
  }, [id, yamlNode?.tool, yamlNode?.toolkit_name, yamlNode?.type]);
  const selectedTool = useMemo(() => yamlNode?.tool || '', [yamlNode?.tool]);
  const [initialToolkit] = useState(toolkit);
  const [initialTool] = useState(yamlNode?.tool || '');
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const selectedToolkit = useMemo(
    () =>
      (values?.version_details?.tools || [])
        .map(tool => {
          if (tool.toolkit_name) {
            return tool;
          } else {
            return {
              ...tool,
              toolkit_name: getToolkitNameFromSchema(tool),
            };
          }
        })
        .find(tool => tool.toolkit_name === toolkit || tool.name === toolkit),
    [getToolkitNameFromSchema, toolkit, values?.version_details?.tools],
  );

  const mcpArgsSchemas = useMemo(() => {
    return (
      selectedToolkit?.settings?.available_mcp_tools?.reduce((acc, tool) => {
        if (tool.args_schema) {
          acc[tool.value] = tool.args_schema;
        }
        return acc;
      }, {}) || {}
    );
  }, [selectedToolkit?.settings?.available_mcp_tools]);

  const staticArgsSchemasKeys = useMemo(() => {
    const argsSchemas = toolkitTypes?.[selectedToolkit?.type]?.properties?.selected_tools?.args_schemas || {};
    return Object.keys(argsSchemas);
  }, [selectedToolkit?.type, toolkitTypes]);

  const shouldFetchDynamicSchemas = useMemo(() => {
    if (!projectId) return false;
    if (!selectedToolkit?.id) return false;
    return !staticArgsSchemasKeys.length;
  }, [projectId, selectedToolkit?.id, staticArgsSchemasKeys.length]);

  const { data: toolkitAvailableToolsData } = useToolkitAvailableToolsQuery(
    { projectId, toolkitId: selectedToolkit?.id },
    { skip: !shouldFetchDynamicSchemas },
  );

  const dynamicArgsSchemas = useMemo(() => {
    return toolkitAvailableToolsData?.args_schemas || {};
  }, [toolkitAvailableToolsData?.args_schemas]);

  const dynamicToolNames = useMemo(() => {
    const tools = toolkitAvailableToolsData?.tools || [];
    return tools.map(t => t?.name).filter(name => typeof name === 'string' && name.trim());
  }, [toolkitAvailableToolsData?.tools]);

  const [requiredInputs, setRequiredInputs] = useState([]);
  const [inputMappings, setInputMappings] = useState({});
  const [defaultValues, setDefaultValues] = useState({});
  const [mappingInfo, setMappingInfo] = useState({});

  useEffect(() => {
    const {
      mapping,
      defaultValues: initialValues,
      mappingInfo: initialMappingInfo,
    } = FlowEditorHelpers.getDefaultInputMappingOfTool(
      toolkitTypes,
      selectedTool,
      yamlNode?.input_mapping,
      selectedToolkit,
      selectedToolkit?.type !== 'mcp' ? dynamicArgsSchemas : mcpArgsSchemas,
    );

    setInputMappings(mapping);
    setDefaultValues(initialValues);
    setMappingInfo(initialMappingInfo);
    const existingInputMapping = Object.keys(yamlNode?.input_mapping || {});
    if (
      !existingInputMapping.length ||
      requiredInputs.find(input => !existingInputMapping.includes(input)) ||
      (selectedTool && initialTool !== selectedTool) ||
      initialToolkit !== toolkit
    ) {
      // Filter mapping to only include required fields or fields with non-empty values
      // This prevents optional empty parameters from being added to YAML initially
      const filteredMapping = Object.entries(mapping).reduce((result, [key, value]) => {
        const isRequired = requiredInputs.includes(key);
        const hasValue = value?.value !== '' && value?.value !== undefined;

        // Only include if required OR has a non-empty value
        if (isRequired || hasValue) {
          result[key] = value;
        }
        return result;
      }, {});

      // Only update if there is no existing mapping or the tool/toolkit has changed or required inputs have changed
      FlowEditorHelpers.updateYamlNode(
        id,
        'input_mapping',
        filteredMapping,
        yamlJsonObject,
        setYamlJsonObject,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicArgsSchemas, mcpArgsSchemas, toolkitTypes, selectedTool, selectedToolkit]);

  useEffect(() => {
    const { required } = FlowEditorHelpers.getRequiredInputsAndTooltips(
      toolkitTypes,
      selectedTool,
      selectedToolkit,
      dynamicArgsSchemas,
    );
    setRequiredInputs(required);
  }, [dynamicArgsSchemas, selectedTool, selectedToolkit, toolkitTypes]);

  const onChangeTool = useCallback(
    newValue => {
      if (newValue) {
        const argsSchemas = selectedToolkit?.type !== 'mcp' ? dynamicArgsSchemas : mcpArgsSchemas;
        const { mapping } = FlowEditorHelpers.getDefaultInputMappingOfTool(
          toolkitTypes,
          newValue,
          yamlNode?.input_mapping,
          selectedToolkit,
          argsSchemas,
        );
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          {
            tool: newValue,
            input_mapping: {
              ...mapping,
            },
          },
          yamlJsonObject,
          setYamlJsonObject,
        );
      } else {
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          { tool: undefined, input_mapping: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
      }
    },
    [
      dynamicArgsSchemas,
      mcpArgsSchemas,
      id,
      selectedToolkit,
      setYamlJsonObject,
      toolkitTypes,
      yamlJsonObject,
      yamlNode?.input_mapping,
    ],
  );

  const onChangeMapping = useCallback(
    (variable, value, dataType) => {
      // Check if this is an optional parameter being cleared
      const isOptional = !requiredInputs.includes(variable);
      const isEmpty = value?.value === '' || value?.value === undefined;
      setMappingInfo(prev => ({
        ...prev,
        [variable]: {
          ...(prev?.[variable] || {}),
          type: value.type || prev?.[variable]?.type || 'fixed',
          value: value.value,
        },
      }));
      // If it's an optional parameter and the value is empty, remove it from input_mapping
      if (isOptional && isEmpty) {
        const node = yamlJsonObject.nodes?.find(n => n.id === id);
        if (node?.input_mapping && variable in node.input_mapping) {
          const updatedMapping = { ...node.input_mapping };
          delete updatedMapping[variable];
          FlowEditorHelpers.updateYamlNode(
            id,
            'input_mapping',
            updatedMapping,
            yamlJsonObject,
            setYamlJsonObject,
          );
          return;
        }
      }

      // Otherwise, update the mapping normally
      FlowEditorHelpers.updateYamlNodeInputMappingVariable(
        id,
        variable,
        value,
        yamlJsonObject,
        setYamlJsonObject,
        dataType,
      );
    },
    [id, requiredInputs, setYamlJsonObject, yamlJsonObject],
  );

  return {
    toolkitTypes,
    onChangeTool,
    onChangeMapping,
    requiredInputs,
    mappingInfo,
    inputMappings,
    defaultValues,
    selectedToolkit,
    dynamicToolNames,
    dynamicArgsSchemas,
    selectedTool,
    toolkit,
  };
};
