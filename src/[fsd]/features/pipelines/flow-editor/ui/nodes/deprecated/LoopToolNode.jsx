import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';
import { useEdges } from '@xyflow/react';

const LoopToolNode = memo(props => {
  const { id, data, selected, type } = props;

  const edges = useEdges();
  const { yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const isSourceConnectable = useMemo(
    () =>
      !edges.find(edge => edge.source === id && edge.target !== FlowEditorConstants.PipelineNodeTypes.End),
    [edges, id],
  );

  const onChangeMapping = useCallback(
    (key, value) => {
      const fieldName = 'variables_mapping';

      const clonedVariablesMapping = { ...yamlNode[fieldName] };
      clonedVariablesMapping[key] = value;
      FlowEditorHelpers.updateYamlNode(
        yamlNode.id,
        fieldName,
        clonedVariablesMapping,
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [setYamlJsonObject, yamlJsonObject, yamlNode],
  );

  const onDeleteMapping = useCallback(
    output => {
      FlowEditorHelpers.removeYamlNodeVariablesMapping(id, output, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  const taskValue = useMemo(() => {
    return yamlNode?.task || '';
  }, [yamlNode?.task]);

  const handleSetTask = useCallback(
    e => {
      FlowEditorHelpers.updateYamlNode(id, 'task', e.target.value, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const {
    values: { version_details },
  } = useFormikContext();
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const getSelectedToolkit = useCallback(
    toolkitName => {
      return (version_details?.tools || []).find(tool => {
        if (tool.toolkit_name) {
          return tool.toolkit_name === toolkitName;
        } else {
          return tool.name === toolkitName || getToolkitNameFromSchema(tool) === toolkitName;
        }
      });
    },
    [getToolkitNameFromSchema, version_details?.tools],
  );

  const onChangeToolkit = useCallback(
    newValue => {
      if (!newValue) {
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          { toolkit_name: undefined, tool: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
        return;
      }
      const toolkitDetails = getSelectedToolkit(newValue);
      const payload = {
        toolkit_name: newValue,
        tool: undefined,
      };
      if (['application'].includes(toolkitDetails?.type)) {
        payload.toolkit_name = undefined;
        payload.tool = newValue;
      }
      FlowEditorHelpers.batchUpdateYamlNode(id, payload, yamlJsonObject, setYamlJsonObject);
    },
    [getSelectedToolkit, id, setYamlJsonObject, yamlJsonObject],
  );

  const onChangeTool = useCallback(
    newValue => {
      FlowEditorHelpers.updateYamlNode(id, 'tool', newValue, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  const onChangeLoopToolkit = useCallback(
    newValue => {
      if (!newValue) {
        FlowEditorHelpers.batchUpdateYamlNode(
          yamlNode.id,
          { loop_toolkit_name: undefined, loop_tool: undefined, variables_mapping: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
        return;
      }
      const toolkitDetails = getSelectedToolkit(newValue);

      const { mapping } = FlowEditorHelpers.getDefaultInputMappingOfTool(
        toolkitSchemas,
        yamlNode.loop_tool,
        yamlNode.variables_mapping,
        toolkitDetails,
      );

      const payload = {
        variables_mapping: mapping,
        loop_toolkit_name: newValue,
        loop_tool: undefined,
      };
      if (['application'].includes(toolkitDetails?.type)) {
        payload.loop_toolkit_name = undefined;
        payload.loop_tool = newValue;
      }
      FlowEditorHelpers.batchUpdateYamlNode(yamlNode.id, payload, yamlJsonObject, setYamlJsonObject);
    },
    [
      setYamlJsonObject,
      toolkitSchemas,
      yamlJsonObject,
      yamlNode?.id,
      yamlNode?.loop_tool,
      yamlNode?.variables_mapping,
      getSelectedToolkit,
    ],
  );

  const onChangeLoopTool = useCallback(
    newValue => {
      const toolkitDetails = getSelectedToolkit(yamlNode.loop_toolkit_name);
      const { mapping } = FlowEditorHelpers.getDefaultInputMappingOfTool(
        toolkitSchemas,
        newValue,
        yamlNode.variables_mapping,
        toolkitDetails,
      );
      FlowEditorHelpers.batchUpdateYamlNode(
        yamlNode?.id,
        {
          variables_mapping: mapping,
          loop_tool: newValue,
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [
      getSelectedToolkit,
      setYamlJsonObject,
      toolkitSchemas,
      yamlJsonObject,
      yamlNode?.id,
      yamlNode?.loop_toolkit_name,
      yamlNode?.variables_mapping,
    ],
  );

  return (
    <>
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
                isConnectable={isSourceConnectable && !isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
            </>
          );
        }}
      >
        <FlowEditorSelect.LoopToolSelect
          yamlNode={yamlNode}
          disabled={isRunningPipeline || disabled}
          onChangeToolkit={onChangeToolkit}
          onChangeTool={onChangeTool}
        />
        <FlowEditorSelect.LoopToolSelect
          yamlNode={yamlNode}
          disabled={isRunningPipeline || disabled}
          onChangeToolkit={onChangeLoopToolkit}
          onChangeTool={onChangeLoopTool}
          label="Loop toolkit"
          toolkitField="loop_toolkit_name"
          toolField="loop_tool"
        />
        <FlowEditorSettings.VariablesMapping
          variables_mapping={yamlNode?.variables_mapping || {}}
          onChangeMapping={onChangeMapping}
          onDeleteMapping={onDeleteMapping}
          disabled={isRunningPipeline || disabled}
        />

        <Input.StyledInputEnhancer
          disabled={isRunningPipeline || disabled}
          autoComplete="off"
          showexpandicon="true"
          maxRows={3}
          minRows={1}
          showCopyAction={false}
          showExpandAction={false}
          multiline
          variant="standard"
          fullWidth
          name="task"
          label="Task"
          placeholder=""
          value={taskValue}
          onInput={handleSetTask}
          hasActionsToolBar
          fieldName="Task"
          containerProps={{
            marginBottom: '0px !important',
            className: 'nowheel',
          }}
        />
        <FlowEditorSelect.InputSelect
          id={id}
          label={'Input'}
          inputFieldName={'input'}
          disabled={isRunningPipeline || disabled}
        />
        <FlowEditorSelect.OutputSelect
          id={id}
          label="Output"
          outputFieldName="output"
          disabled={isRunningPipeline || disabled}
        />
        <FlowEditorSettings.CommonInterruptSettings
          id={id}
          type={FlowEditorConstants.PipelineNodeTypes.LoopFromTool}
          disabled={isRunningPipeline || disabled}
        />
      </FlowEditorNodes.NodeCard>
    </>
  );
});

LoopToolNode.displayName = 'LoopToolNode';

export default LoopToolNode;
