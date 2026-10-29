import YAML from 'js-yaml';
import { useSelector } from 'react-redux';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { LayoutHelpers, ParsePipelineHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useIsFrom, useIsFromPipelineDetail } from '@/[fsd]/shared/lib/hooks';
import RouteDefinitions from '@/routes';
import { selectActivePipeline } from '@/slices/pipeline';

const { ORIENTATION } = FlowEditorConstants;

export default function useSavePipeline() {
  const isFromPipelineDetail = useIsFromPipelineDetail();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const { nodes, edges } = useSelector(state => state.pipelineEditor);
  const { yamlCode, yamlJsonObject, initState, orientation } = useSelector(selectActivePipeline);

  const hasPipelineData =
    initState.yamlJsonObject?.nodes?.length > 0 ||
    initState.yamlCode?.length > 0 ||
    yamlJsonObject?.nodes?.length > 0;
  const isFromPipeline = isFromPipelineDetail || (isFromChat && hasPipelineData);

  return {
    isFromPipeline,
    nodes,
    edges,
    yamlCode,
    orientation: orientation || ORIENTATION.vertical,
  };
}

export const calculateNodesAndEdges = (yamlCode, orientation = ORIENTATION.vertical, flowNodes) => {
  let parsedYamlJson = undefined;
  try {
    parsedYamlJson = YAML.load(yamlCode);
  } catch {
    // YAML parsing failed, parsedYamlJson remains undefined
  }
  const { nodes: parsedNodes, edges: parsedEdges } = ParsePipelineHelpers.parseYaml(
    parsedYamlJson,
    orientation,
  );
  // Saves the layout the user sees; only nodes the canvas hasn't placed yet get arranged
  return LayoutHelpers.mergeCanvasPositions({
    nodes: parsedNodes,
    edges: parsedEdges,
    flowNodes,
    orientation,
  });
};
