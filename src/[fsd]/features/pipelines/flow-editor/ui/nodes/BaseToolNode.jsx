import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { getDefaultInputMappingOfTool } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/flowEditor.helpers';
import {
  useFunctionInputMapping,
  useGetToolkitNameFromSchema,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const filterTypes = tool => ![ToolTypes.application.value].includes(tool.type);

const BaseToolNode = memo(props => {
  const {
    id,
    data,
    selected,
    nodeType,
    showStructuredOutput = false,
    customFilterTypes = filterTypes,
  } = props;

  const { isRunningPipeline, yamlJsonObject, setYamlJsonObject } = useContext(FlowEditorContext);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const {
    onChangeTool,
    onChangeMapping,
    toolkitTypes,
    requiredInputs,
    mappingInfo,
    selectedTool,
    toolkit,
    selectedToolkit,
    dynamicToolNames,
    inputMappings,
    defaultValues,
  } = useFunctionInputMapping({ id, isMCP: nodeType === FlowEditorConstants.PipelineNodeTypes.Mcp });

  const { getToolkitNameFromSchema, getSelectedTools } = useGetToolkitNameFromSchema();

  const functionOptions = useMemo(() => {
    const explicitSelected = selectedToolkit?.settings?.selected_tools;
    const hasExplicitSelection = Array.isArray(explicitSelected) && explicitSelected.length > 0;
    const availableTools = getSelectedTools(selectedToolkit?.type);
    const hasAvailableCheck = Array.isArray(availableTools) && availableTools.length > 0;

    let enabledTools;
    if (hasExplicitSelection && hasAvailableCheck) {
      enabledTools = explicitSelected.filter(tool =>
        availableTools.includes(FlowEditorHelpers.getToolName(tool)),
      );
    } else if (hasExplicitSelection) {
      enabledTools = explicitSelected;
    } else {
      enabledTools = dynamicToolNames;
    }

    return (enabledTools || [])
      .map(item => ({
        label: FlowEditorHelpers.getToolName(item),
        value: FlowEditorHelpers.getToolName(item),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dynamicToolNames, getSelectedTools, selectedToolkit?.settings?.selected_tools, selectedToolkit?.type]);

  const onSelectToolkit = useCallback(
    newToolkit => {
      if (!newToolkit) {
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          { toolkit_name: undefined, tool: undefined, input_mapping: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
        return;
      }
      const { mapping } = getDefaultInputMappingOfTool(
        toolkitTypes,
        undefined,
        yamlNode?.input_mapping,
        newToolkit,
      );

      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          toolkit_name: newToolkit.toolkit_name || getToolkitNameFromSchema(newToolkit),
          tool: undefined,
          input_mapping: { ...mapping },
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [getToolkitNameFromSchema, id, setYamlJsonObject, toolkitTypes, yamlJsonObject, yamlNode?.input_mapping],
  );

  const onClearTool = useCallback(() => {
    onChangeTool(null);
  }, [onChangeTool]);

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={nodeType}
      isPerforming={data?.isPerforming}
      id={id}
      handles={() => {
        return (
          <>
            <FlowEditorNodes.CustomHandle
              type="target"
              id="target"
              isConnectable={!isRunningPipeline}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="source"
              isConnectable={!isRunningPipeline}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
          </>
        );
      }}
    >
      <FlowEditorSelect.ToolSelect
        id={id}
        onSelectTool={onSelectToolkit}
        selectedToolkit={toolkit}
        disabled={isRunningPipeline}
        filterTypes={customFilterTypes}
      />
      {functionOptions.length > 0 && (
        <SingleSelect
          sx={styles.toolSelect}
          label={'Tool'}
          value={selectedTool}
          onValueChange={onChangeTool}
          options={functionOptions}
          disabled={isRunningPipeline}
          showBorder
          className={'nopan nodrag'}
          onClear={onClearTool}
        />
      )}
      <FlowEditorSelect.InputSelect
        id={id}
        inputFieldName={'input'}
        disabled={isRunningPipeline}
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
      />
      <FlowEditorSettings.InputMapping
        requiredInputs={requiredInputs}
        mappingInfo={mappingInfo}
        input_mapping={inputMappings}
        defaultValues={defaultValues}
        values={yamlNode?.input_mapping || {}}
        onChangeMapping={onChangeMapping}
        disabled={isRunningPipeline}
      />
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        showStructuredOutput={showStructuredOutput}
        type={nodeType}
        disabled={isRunningPipeline}
      />
    </FlowEditorNodes.NodeCard>
  );
});

const styles = {
  toolSelect: { marginBottom: '0rem' },
};

BaseToolNode.displayName = 'BaseToolNode';

export default BaseToolNode;
