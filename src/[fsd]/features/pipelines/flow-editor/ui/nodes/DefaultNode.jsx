import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
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

const DefaultNode = memo(props => {
  const { id, data, selected, type } = props;

  const { isRunningPipeline, yamlJsonObject, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const { values } = useFormikContext();
  const {
    onChangeTool,
    onChangeMapping,
    toolkitTypes,
    requiredInputs,
    mappingInfo,
    inputMappings,
    defaultValues,
    selectedTool,
    toolkit,
  } = useFunctionInputMapping({ id });
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();

  // Memoize tools array to prevent unnecessary recalculations
  const memoizedTools = useMemo(() => values?.version_details?.tools || [], [values?.version_details?.tools]);

  // Memoize tools with names to prevent recreating objects
  const toolsWithNames = useMemo(() => {
    return memoizedTools.map(tool => {
      if (tool.toolkit_name) {
        return tool;
      } else {
        return {
          ...tool,
          toolkit_name: getToolkitNameFromSchema(tool),
        };
      }
    });
  }, [memoizedTools, getToolkitNameFromSchema]);

  const functionOptions = useMemo(() => {
    if (!toolkit || !toolsWithNames.length) {
      return [];
    }

    const selectedToolkit = toolsWithNames.find(
      tool => tool.toolkit_name === toolkit || tool.name === toolkit,
    );

    if (!selectedToolkit?.settings?.selected_tools) {
      return [];
    }

    return selectedToolkit.settings.selected_tools
      .map(item => {
        const toolName = FlowEditorHelpers.getToolName(item);
        return {
          label: toolName,
          value: toolName,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [toolkit, toolsWithNames]);

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
      const { mapping } = FlowEditorHelpers.getDefaultInputMappingOfTool(
        toolkitTypes,
        selectedTool,
        yamlNode?.input_mapping,
        newToolkit,
      );
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          toolkit_name:
            newToolkit.type !== ToolTypes.application.value
              ? newToolkit.toolkit_name || getToolkitNameFromSchema(newToolkit)
              : undefined,
          tool: newToolkit.type === ToolTypes.application.value ? newToolkit.name : undefined,
          input_mapping: { ...mapping },
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [
      id,
      setYamlJsonObject,
      yamlJsonObject,
      toolkitTypes,
      selectedTool,
      yamlNode?.input_mapping,
      getToolkitNameFromSchema,
    ],
  );

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={type}
      isPerforming={data?.isPerforming}
      id={id}
      handles={() => {
        return (
          <>
            <FlowEditorNodes.CustomHandle
              type="target"
              id="target"
              isConnectable={!isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="source"
              isConnectable={!isRunningPipeline && !disabled}
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
        disabled={isRunningPipeline || disabled}
      />
      {functionOptions.length > 0 && (
        <SingleSelect
          sx={styles.select}
          label={'Tool'}
          value={selectedTool}
          onValueChange={onChangeTool}
          options={functionOptions}
          disabled={isRunningPipeline || disabled}
          showBorder
          className={'nopan nodrag'}
        />
      )}
      <FlowEditorSelect.InputSelect
        id={id}
        inputFieldName={'input'}
        disabled={isRunningPipeline || disabled}
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
        disabled={isRunningPipeline || disabled}
      />
      <FlowEditorSettings.InputMapping
        requiredInputs={requiredInputs}
        mappingInfo={mappingInfo}
        input_mapping={inputMappings}
        defaultValues={defaultValues}
        values={yamlNode?.input_mapping || {}}
        onChangeMapping={onChangeMapping}
        disabled={isRunningPipeline || disabled}
      />
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        showStructuredOutput={true}
        type={type}
        disabled={isRunningPipeline || disabled}
      />
      <FlowEditorSettings.CustomNodeInput id={id} />
    </FlowEditorNodes.NodeCard>
  );
});

DefaultNode.displayName = 'DefaultNode';

// Custom comparison function to prevent re-renders during rapid drag operations
const arePropsEqual = (prevProps, nextProps) => {
  // Compare all props except data.isPerforming which changes during drag
  return (
    prevProps.id === nextProps.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.type === nextProps.type &&
    // Only compare isPerforming if it's not a rapid change
    prevProps.data?.isPerforming === nextProps.data?.isPerforming
  );
};

export default memo(DefaultNode, arePropsEqual);

const styles = {
  select: { marginBottom: '0rem' },
};
