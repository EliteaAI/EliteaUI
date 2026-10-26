import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';

import { parseYaml } from './parsePipeline.helpers';

export const TEST_BLOCK_REASONS = {
  noNodes: 'Add and configure at least one node connected to End.',
  noEntryPoint: 'Set an entry point to test the pipeline.',
  noPathToEnd: 'Connect the entry point to End to test the pipeline.',
};

export const getNodeNotConfiguredReason = (nodeId, issue) => `Configure node "${nodeId}": ${issue}`;

export const isEndReachable = (edges = [], startId) => {
  const targetsBySource = edges.reduce((acc, { source, target }) => {
    if (source && target) {
      acc[source] = [...(acc[source] || []), target];
    }
    return acc;
  }, {});

  const visited = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const current = queue.shift();
    if (current === PipelineNodeTypes.End) return true;
    (targetsBySource[current] || []).forEach(target => {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push(target);
      }
    });
  }
  return false;
};

const getBranchingConfig = node => {
  if (node.type === PipelineNodeTypes.Router || node.type === PipelineNodeTypes.Hitl) return null;
  if (node.condition && typeof node.condition === 'object') return node.condition;
  if (node.decision && typeof node.decision === 'object') return node.decision;
  if (node.type === PipelineNodeTypes.Decision) return node;
  return null;
};

// The SDK routes an omitted default_output to END, but the canvas draws no edge for it
const getImplicitEndEdges = yamlNodes =>
  yamlNodes
    .filter(node => {
      const branchingConfig = getBranchingConfig(node);
      return branchingConfig && !('default_output' in branchingConfig);
    })
    .map(node => ({ source: node.id, target: PipelineNodeTypes.End }));

// Returns '' when the flow can be tested, otherwise the reason shown in the Test Pipeline tooltip.
// `nodeIssuesById` holds what each node card reports as "Not configured".
export const getTestBlockReason = (yamlJsonObject, nodeIssuesById = {}) => {
  const yamlNodes = yamlJsonObject?.nodes?.filter(Boolean) || [];
  const entryPoint = yamlJsonObject?.entry_point;

  if (!yamlNodes.length) return TEST_BLOCK_REASONS.noNodes;
  if (!entryPoint || !yamlNodes.some(node => node.id === entryPoint)) return TEST_BLOCK_REASONS.noEntryPoint;

  let edges = [];
  try {
    ({ edges } = parseYaml(yamlJsonObject));
  } catch {
    return TEST_BLOCK_REASONS.noPathToEnd;
  }

  if (!isEndReachable([...edges, ...getImplicitEndEdges(yamlNodes)], entryPoint)) {
    return TEST_BLOCK_REASONS.noPathToEnd;
  }

  const notConfiguredNode = yamlNodes.find(node => nodeIssuesById[node.id]?.length);
  return notConfiguredNode
    ? getNodeNotConfiguredReason(notConfiguredNode.id, nodeIssuesById[notConfiguredNode.id][0])
    : '';
};
