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

  // Stable, scoped test handles are only added for node types actually
  // exercised by automation — MCP (ELITEA-1954) and Toolkit (ELITEA-2010),
  // both sharing this base component. Other node types (Function/Agent/etc.)
  // intentionally get `undefined` so untested UI doesn't light up as
  // "covered" (.agents/testing.md § Locator policy — testid scope is
  // load-bearing).
  const nodeTestIdPrefix = useMemo(() => {
    if (nodeType === FlowEditorConstants.PipelineNodeTypes.Mcp) return 'pipeline-mcp-node';
    if (nodeType === FlowEditorConstants.PipelineNodeTypes.Toolkit) return 'pipeline-toolkit-node';
    return undefined;
  }, [nodeType]);
  // The optional-mapping-heading and mapping-Type-select testids are new
  // capabilities (ELITEA-2010) exercised only by the Toolkit node's own
  // test today — scoped to Toolkit specifically (not the shared
  // nodeTestIdPrefix) so they don't silently light up on the MCP node,
  // which no current MCP test asserts against (.agents/testing.md §
  // Locator policy — testid scope is load-bearing, canon ruling #511).
  const isToolkitNode = nodeType === FlowEditorConstants.PipelineNodeTypes.Toolkit;

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
        data-testid={nodeTestIdPrefix ? `${nodeTestIdPrefix}-toolkit-select` : undefined}
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
          data-testid={nodeTestIdPrefix ? `${nodeTestIdPrefix}-tool-select` : undefined}
        />
      )}
      <FlowEditorSelect.InputSelect
        id={id}
        inputFieldName={'input'}
        disabled={isRunningPipeline}
        dataTestId={nodeTestIdPrefix ? `${nodeTestIdPrefix}-input-select` : undefined}
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
        dataTestId={nodeTestIdPrefix ? `${nodeTestIdPrefix}-output-select` : undefined}
      />
      <FlowEditorSettings.InputMapping
        requiredInputs={requiredInputs}
        mappingInfo={mappingInfo}
        input_mapping={inputMappings}
        defaultValues={defaultValues}
        values={yamlNode?.input_mapping || {}}
        onChangeMapping={onChangeMapping}
        disabled={isRunningPipeline}
        valueTestIdPrefix={nodeTestIdPrefix ? `${nodeTestIdPrefix}-input-mapping-value` : undefined}
        requiredHeadingTestId={nodeTestIdPrefix ? `${nodeTestIdPrefix}-input-mapping-heading` : undefined}
        optionalHeadingTestId={
          isToolkitNode ? `${nodeTestIdPrefix}-input-mapping-optional-heading` : undefined
        }
        typeTestIdPrefix={isToolkitNode ? `${nodeTestIdPrefix}-input-mapping-type-select` : undefined}
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
