import YAML from 'js-yaml';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  FlowEditorHelpers,
  LayoutHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

const { ORIENTATION, PIPELINE_STATE } = FlowEditorConstants;

/**
 * The canvas of a pipeline whose YAML was replaced outside the editor (Compare versions).
 * Nodes that keep their id keep their stored position, new or renamed ids are placed next to the layout,
 * and removed nodes and their edges are dropped. Returns null when the YAML doesn't parse, so the stored
 * canvas is kept.
 */
export const rebuildPipelineSettingsFromYaml = (yamlText, pipelineSettings = {}) => {
  let parsedYaml;
  try {
    parsedYaml = YAML.load(yamlText || '') || {};
  } catch {
    return null;
  }

  const orientation = pipelineSettings?.orientation || ORIENTATION.vertical;
  const layoutVersion = pipelineSettings?.layout_version;
  const { nodes: parsedNodes, edges: parsedEdges } = ParsePipelineHelpers.parseYaml(parsedYaml, orientation);
  const storedNodes = (pipelineSettings?.nodes || []).filter(node => node.type !== PIPELINE_STATE);
  const { nodes, edges } = LayoutHelpers.mergeCanvasPositions({
    nodes: parsedNodes,
    edges: parsedEdges,
    flowNodes: storedNodes,
    orientation,
  });

  return {
    ...pipelineSettings,
    nodes: nodes.map(node => FlowEditorHelpers.convertNode(node, layoutVersion)),
    edges,
    orientation,
  };
};
