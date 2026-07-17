import YAML from 'js-yaml';
import { useSelector } from 'react-redux';

import { ORIENTATION } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { LayoutHelpers, ParsePipelineHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useIsFrom, useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import RouteDefinitions from '@/routes';

export default function useSavePipeline() {
  const isFromPipelineDetail = useIsFromPipelineDetail();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const { nodes, edges } = useSelector(state => state.pipelineEditor);
  const { yamlCode, yamlJsonObject, initState } = useSelector(state => state.pipeline);

  // Determine if we're editing a pipeline:
  // - initState covers existing pipelines even when the user has deleted all nodes (initState
  //   holds the original loaded data and won't empty out during editing).
  // - yamlJsonObject covers new pipelines being built from scratch (initState is empty until
  //   after the first save/load).
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
  return LayoutHelpers.doLayout({ nodes: parsedNodes, edges: parsedEdges, flowNodes, orientation });
};
