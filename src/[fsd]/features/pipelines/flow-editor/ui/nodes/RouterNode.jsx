import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig, useNodeOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes, FlowEditorSelect } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { Chip } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useEdges } from '@xyflow/react';

const RouterNode = memo(props => {
  const { id, data, selected, nodeType = FlowEditorConstants.PipelineNodeTypes.Router } = props;

  const edges = useEdges();
  const { setFlowEdges, yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } =
    useContext(FlowEditorContext);
  const pipelineLLMConfig = useNodeAiAssistantConfig();
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const routes = useNodeOptions(node => node.id !== id, true);
  const isTargetConnectable = useMemo(() => !edges.find(edge => edge.target === id), [edges, id]);
  const isDefaultConnectable = useMemo(
    () =>
      !edges.find(
        edge =>
          edge.source === id &&
          edge.sourceHandle === `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_default_output`,
      ),
    [edges, id],
  );

  const default_output_node = useMemo(() => {
    return yamlNode?.default_output || 'END';
  }, [yamlNode?.default_output]);

  const handleDefaultOutput = useCallback(
    value => {
      FlowEditorHelpers.updateYamlNode(
        id,
        FlowEditorConstants.DEFAULT_OUTPUT,
        value,
        yamlJsonObject,
        setYamlJsonObject,
      );
      setFlowEdges(prevEdges => {
        const filteredEdges = prevEdges.filter(
          edge =>
            edge.source !== id ||
            edge.sourceHandle !== `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_default_output`,
        );
        if (value) {
          const existingEdge = filteredEdges.find(
            edge =>
              edge.target === value &&
              edge.source === id &&
              edge.sourceHandle === `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_default_output`,
          );
          if (!existingEdge) {
            return [
              ...filteredEdges,
              {
                id: `${FlowEditorConstants.EDGE_PREFIX}${id}default_output---${value}`,
                source: id,
                sourceHandle: `${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_default_output`,
                target: value,
                type: 'custom',
                data: {
                  label: yamlJsonObject.interrupt_before?.includes(value) ? 'interrupt' : undefined,
                },
              },
            ];
          }
        }
        return filteredEdges;
      });
    },
    [id, setFlowEdges, setYamlJsonObject, yamlJsonObject],
  );

  const conditionValue = useMemo(() => {
    return yamlNode?.condition || '';
  }, [yamlNode?.condition]);

  const handleConditionFilling = useCallback(
    e => {
      FlowEditorHelpers.updateYamlNode(id, 'condition', e.target.value, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <>
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
                id={FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}
                isConnectable={!isRunningPipeline && isTargetConnectable && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
              <FlowEditorNodes.CustomHandle
                type="source"
                id={`${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_routes`}
                isConnectable={!isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
                style={{ left: 'calc(50% - 3.125rem)' }}
              />
              <FlowEditorNodes.CustomHandle
                type="source"
                id={`${FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX}_default_output`}
                label="Default output"
                isConnectable={!isRunningPipeline && isDefaultConnectable && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
                style={{ left: 'calc(50% + 3.125rem)' }}
              />
            </>
          );
        }}
      >
        <AIAssistantInput
          disabled={isRunningPipeline || disabled}
          autoComplete="off"
          showexpandicon="true"
          collapseContent
          showCopyAction={true}
          showExpandAction={true}
          multiline
          variant="standard"
          fullWidth
          name="condition"
          label="Condition"
          placeholder=""
          value={conditionValue}
          onInput={handleConditionFilling}
          hasActionsToolBar
          fieldName="Condition"
          language="jinja"
          containerProps={{
            marginBottom: '0rem !important',
            className: 'nowheel',
          }}
          modelConfig={pipelineLLMConfig}
        />
        <FlowEditorSelect.RouteSelect
          id={id}
          label="Routes"
          fieldName="routes"
          disabled={isRunningPipeline || disabled}
          nodesFilter={node => node.id !== id}
          addEndNode
        />
        <FlowEditorSelect.InputSelect
          id={id}
          label="Input"
          inputFieldName="input"
          disabled={isRunningPipeline || disabled}
        />
        <SingleSelect
          sx={{ marginBottom: '0rem' }}
          labelNode={<Chip.HeadingChip label="Default output" />}
          value={default_output_node}
          onValueChange={handleDefaultOutput}
          options={routes}
          disabled={isRunningPipeline || disabled}
          showBorder
          className="nopan nodrag"
        />
      </FlowEditorNodes.NodeCard>
    </>
  );
});

RouterNode.displayName = 'RouterNode';

export default RouterNode;
