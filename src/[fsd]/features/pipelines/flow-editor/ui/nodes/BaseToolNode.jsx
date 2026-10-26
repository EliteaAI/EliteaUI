import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { getDefaultInputMappingOfTool } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/flowEditor.helpers';
import {
  useFunctionInputMapping,
  useGetToolkitNameFromSchema,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodePanel,
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { capitalizeFirstChar } from '@/common/utils';
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

  const { isRunningPipeline, yamlJsonObject, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
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

  const isReadOnly = isRunningPipeline || disabled;
  // Function is a deprecated type: the panel shows its fields as they always were
  const isDeprecatedLayout = nodeType === FlowEditorConstants.PipelineNodeTypes.Function;

  const [revealedOptionalKeys, setRevealedOptionalKeys] = useState([]);

  // Added-but-empty optional parameters belong to the tool they were added for
  useEffect(() => {
    setRevealedOptionalKeys([]);
  }, [toolkit, selectedTool]);
  const mappingKeys = useMemo(() => Object.keys(inputMappings || {}), [inputMappings]);
  const requiredKeys = useMemo(
    () => mappingKeys.filter(key => requiredInputs.includes(key)),
    [mappingKeys, requiredInputs],
  );
  const optionalKeys = useMemo(
    () => mappingKeys.filter(key => !requiredInputs.includes(key)),
    [mappingKeys, requiredInputs],
  );
  // Optional parameters are listed only once they have a value (or were just added)
  const shownOptionalKeys = useMemo(
    () =>
      optionalKeys.filter(
        key => key in (yamlNode?.input_mapping || {}) || revealedOptionalKeys.includes(key),
      ),
    [optionalKeys, revealedOptionalKeys, yamlNode?.input_mapping],
  );
  const addableOptionalParameters = useMemo(
    () =>
      optionalKeys
        .filter(key => !shownOptionalKeys.includes(key))
        .map(key => ({
          key,
          label: inputMappings[key]?.title || capitalizeFirstChar(key.replaceAll('_', ' ')),
        })),
    [inputMappings, optionalKeys, shownOptionalKeys],
  );
  const onRevealOptionalParameter = useCallback(key => {
    setRevealedOptionalKeys(prev => [...prev, key]);
  }, []);

  const mappingFieldsProps = {
    input_mapping: inputMappings,
    mappingInfo,
    defaultValues,
    values: yamlNode?.input_mapping || {},
    onChangeMapping,
    disabled: isReadOnly,
    valueTestIdPrefix: testIdPrefix ? `${testIdPrefix}-input-mapping-value` : undefined,
    // Toolkit-only (ELITEA-2010), same as the accordion below
    typeTestIdPrefix:
      nodeType === FlowEditorConstants.PipelineNodeTypes.Toolkit
        ? `${testIdPrefix}-input-mapping-type`
        : undefined,
  };

  const toolkitSelect = (
    <FlowEditorSelect.ToolSelect
      id={id}
      label={nodeType === FlowEditorConstants.PipelineNodeTypes.Mcp ? 'MCP' : 'Toolkit'}
      onSelectTool={onSelectToolkit}
      selectedToolkit={toolkit}
      disabled={isReadOnly}
      filterTypes={customFilterTypes}
      data-testid={testIdPrefix ? `${testIdPrefix}-toolkit-select` : undefined}
    />
  );
  const toolSelect = functionOptions.length > 0 && (
    <SingleSelect
      sx={styles.toolSelect}
      label={'Tool'}
      value={selectedTool}
      onValueChange={onChangeTool}
      options={functionOptions}
      disabled={isReadOnly}
      showBorder
      className={'nopan nodrag'}
      onClear={onClearTool}
      data-testid={testIdPrefix ? `${testIdPrefix}-tool-select` : undefined}
    />
  );
  const inputSelect = (
    <FlowEditorSelect.InputSelect
      id={id}
      inputFieldName={'input'}
      disabled={isReadOnly}
      dataTestId={testIdPrefix ? `${testIdPrefix}-input-select` : undefined}
    />
  );
  const outputSelect = (
    <FlowEditorSelect.OutputSelect
      id={id}
      label="Output"
      outputFieldName="output"
      disabled={isReadOnly}
      dataTestId={testIdPrefix ? `${testIdPrefix}-output-select` : undefined}
    />
  );
  const structuredOutput = showStructuredOutput && (
    <FlowEditorSettings.CommonNodeSettings
      id={id}
      type={nodeType}
      disabled={isReadOnly}
      structuredOutputTestId={testIdPrefix ? `${testIdPrefix}-structured-output-toggle` : undefined}
    />
  );

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={nodeType}
      isPerforming={data?.isPerforming}
      id={id}
      requiredInputs={requiredInputs}
      handles={() => {
        return (
          <>
            <FlowEditorNodes.CustomHandle
              type="target"
              id="target"
              isConnectable={!isReadOnly}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="source"
              isConnectable={!isReadOnly}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
          </>
        );
      }}
    >
      {isDeprecatedLayout ? (
        <>
          {toolkitSelect}
          {toolSelect}
          {inputSelect}
          {outputSelect}
          <FlowEditorSettings.InputMapping
            requiredInputs={requiredInputs}
            mappingInfo={mappingInfo}
            input_mapping={inputMappings}
            defaultValues={defaultValues}
            values={yamlNode?.input_mapping || {}}
            onChangeMapping={onChangeMapping}
            disabled={isReadOnly}
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
          {structuredOutput}
        </>
      ) : (
        <>
          <FlowEditorNodePanel.NodeConfigSection>
            {toolkitSelect}
            {toolSelect}
            <FlowEditorSettings.InputMappingFields
              keys={requiredKeys}
              {...mappingFieldsProps}
            />
          </FlowEditorNodePanel.NodeConfigSection>
          <FlowEditorNodePanel.NodeConfigSection section={NodePanelConstants.NODE_CONFIG_SECTIONS.advanced}>
            <FlowEditorSettings.InputMappingFields
              keys={shownOptionalKeys}
              {...mappingFieldsProps}
            />
            <FlowEditorSettings.AddOptionalParameterButton
              options={addableOptionalParameters}
              onAdd={onRevealOptionalParameter}
              disabled={isReadOnly}
              testIdPrefix={testIdPrefix}
            />
            {inputSelect}
            {outputSelect}
            {structuredOutput}
          </FlowEditorNodePanel.NodeConfigSection>
        </>
      )}
    </FlowEditorNodes.NodeCard>
  );
});

const styles = {
  toolSelect: { marginBottom: '0rem' },
};

BaseToolNode.displayName = 'BaseToolNode';

export default BaseToolNode;
