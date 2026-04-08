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
import { Input } from '@/[fsd]/shared/ui';
import { useEdges } from '@xyflow/react';

const LoopNode = memo(props => {
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

  const taskValue = useMemo(() => {
    return yamlNode?.task || '';
  }, [yamlNode?.task]);

  const handleSetTask = useCallback(
    e => {
      FlowEditorHelpers.updateYamlNode(id, 'task', e.target.value, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

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
        // id='task'
        label="Task"
        placeholder=""
        value={taskValue}
        // onInput={handleSetTask}
        onChange={handleSetTask}
        hasActionsToolBar
        fieldName="task"
        containerProps={{
          marginBottom: '0rem !important',
          className: 'nowheel',
        }}
      />
      <FlowEditorSelect.InputSelect
        id={id}
        label="Input"
        inputFieldName="input"
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
        type={FlowEditorConstants.PipelineNodeTypes.Loop}
        disabled={isRunningPipeline || disabled}
      />
    </FlowEditorNodes.NodeCard>
  );
});

LoopNode.displayName = 'LoopNode';

export default LoopNode;
