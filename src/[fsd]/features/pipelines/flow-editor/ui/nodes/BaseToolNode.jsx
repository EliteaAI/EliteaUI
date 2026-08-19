import { memo, useCallback, useContext, useMemo } from 'react';

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
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const filterTypes = tool => ![ToolTypes.application.value].includes(tool.type);

// Testid prefix per node type sharing this base component — ELITEA-1954 (MCP)
// + ELITEA-2010 (Toolkit). A node type absent from this map renders every
// field below untagged (see the isMcpNode/testIdPrefix comment in the
// component body).
const TEST_ID_PREFIX_BY_NODE_TYPE = {
  [FlowEditorConstants.PipelineNodeTypes.Mcp]: 'pipeline-mcp-node',
  [FlowEditorConstants.PipelineNodeTypes.Toolkit]: 'pipeline-toolkit-node',
};

const BaseToolNode = memo(props => {
  const {
    id,
    data,
    selected,
    nodeType,
    showStructuredOutput = false,
    customFilterTypes = filterTypes,
  } = props;

  // Stable, scoped test handles are added for the MCP node (ELITEA-1954) and
  // the Toolkit node (ELITEA-2010) — the two node types sharing this base
  // component whose Toolkit/Tool/Input/Output/Input-mapping fields are
  // exercised by automation today. Other node types sharing this base
  // component (Function/Agent/etc.) intentionally resolve to `undefined` so
  // untested UI doesn't light up as "covered" (.agents/testing.md § Locator
  // policy — testid scope is load-bearing).
  const testIdPrefix = TEST_ID_PREFIX_BY_NODE_TYPE[nodeType];

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
        data-testid={testIdPrefix ? `${testIdPrefix}-toolkit-select` : undefined}
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
          data-testid={testIdPrefix ? `${testIdPrefix}-tool-select` : undefined}
        />
      )}
      <FlowEditorSelect.InputSelect
        id={id}
        inputFieldName={'input'}
        disabled={isRunningPipeline}
        dataTestId={testIdPrefix ? `${testIdPrefix}-input-select` : undefined}
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
        dataTestId={testIdPrefix ? `${testIdPrefix}-output-select` : undefined}
      />
      <FlowEditorSettings.InputMapping
        requiredInputs={requiredInputs}
        mappingInfo={mappingInfo}
        input_mapping={inputMappings}
        defaultValues={defaultValues}
        values={yamlNode?.input_mapping || {}}
        onChangeMapping={onChangeMapping}
        disabled={isRunningPipeline}
        valueTestIdPrefix={testIdPrefix ? `${testIdPrefix}-input-mapping-value` : undefined}
        // Toolkit-only (ELITEA-2010): the Input-mapping Type select is exercised only by
        // the Toolkit node's test. The MCP node's equivalent select is untouched by any
        // test and still relies on the positional `#simple-select-Type` workaround — do
        // not widen this to `testIdPrefix` (that would add an unreferenced testid on MCP,
        // .agents/testing.md § Locator policy — testid scope is load-bearing).
        typeTestIdPrefix={
          nodeType === FlowEditorConstants.PipelineNodeTypes.Toolkit
            ? `${testIdPrefix}-input-mapping-type`
            : undefined
        }
        requiredHeadingTestId={testIdPrefix ? `${testIdPrefix}-input-mapping-heading` : undefined}
        // Toolkit-only (ELITEA-2010) — same discipline as typeTestIdPrefix
        // above: only the node type this PR's test exercises gets a
        // testid, so the MCP node's optional-mapping heading stays untagged.
        optionalHeadingTestId={
          nodeType === FlowEditorConstants.PipelineNodeTypes.Toolkit
            ? `${testIdPrefix}-input-mapping-optional-heading`
            : undefined
        }
      />
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        showStructuredOutput={showStructuredOutput}
        type={nodeType}
        disabled={isRunningPipeline}
        // Widened to every node type in TEST_ID_PREFIX_BY_NODE_TYPE
        // (Toolkit since ELITEA-2010, MCP since ELITEA-2037) — both node
        // types' tests now assert these toggles' visibility (case step 6),
        // so `testIdPrefix` truthiness is exactly the "referenced by a
        // test" set (.agents/testing.md § Locator policy — testid scope is
        // load-bearing). Other node types sharing this base component still
        // resolve testIdPrefix to undefined, so they stay untagged.
        interruptAfterTestId={testIdPrefix ? `${testIdPrefix}-interrupt-after-toggle` : undefined}
        structuredOutputTestId={testIdPrefix ? `${testIdPrefix}-structured-output-toggle` : undefined}
      />
    </FlowEditorNodes.NodeCard>
  );
});

const styles = {
  toolSelect: { marginBottom: '0rem' },
};

BaseToolNode.displayName = 'BaseToolNode';

export default BaseToolNode;
