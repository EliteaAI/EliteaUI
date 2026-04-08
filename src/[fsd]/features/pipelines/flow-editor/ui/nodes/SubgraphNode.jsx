import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import { useEdges } from '@xyflow/react';

const toolkitFilter = tool =>
  tool.type === ToolTypes.application.value &&
  tool.agent_type === FlowEditorConstants.PipelineNodeTypes.Pipeline;

const SubgraphNode = memo(props => {
  const { id, data, selected } = props;
  const edges = useEdges();
  const { yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const toolkit = useMemo(() => {
    return yamlNode?.toolkit_name || yamlNode?.tool || id;
  }, [id, yamlNode?.tool, yamlNode?.toolkit_name]);
  const isSourceConnectable = useMemo(
    () =>
      !edges.find(edge => edge.source === id && edge.target !== FlowEditorConstants.PipelineNodeTypes.End),
    [edges, id],
  );
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const onSelectToolkit = useCallback(
    newToolkit => {
      if (!newToolkit) {
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          { toolkit_name: undefined, tool: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
        return;
      }
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          toolkit_name:
            newToolkit.type !== ToolTypes.application.value
              ? newToolkit.toolkit_name || getToolkitNameFromSchema(newToolkit)
              : undefined,
          tool: newToolkit.type === ToolTypes.application.value ? newToolkit.name : undefined,
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [getToolkitNameFromSchema, id, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={FlowEditorConstants.PipelineNodeTypes.Pipeline}
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
      <FlowEditorSelect.ToolSelect
        id={id}
        onSelectTool={onSelectToolkit}
        selectedToolkit={toolkit}
        disabled={isRunningPipeline || disabled}
        filterTypes={toolkitFilter}
      />
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        type={FlowEditorConstants.PipelineNodeTypes.Pipeline}
        disabled={isRunningPipeline || disabled}
        showStructuredOutput={false}
      />
    </FlowEditorNodes.NodeCard>
  );
});

SubgraphNode.displayName = 'SubgraphNode';

export default SubgraphNode;
