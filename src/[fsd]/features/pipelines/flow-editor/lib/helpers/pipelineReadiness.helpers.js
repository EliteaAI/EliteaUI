import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';

import { parseYaml } from './parsePipeline.helpers';

export const TEST_BLOCK_REASONS = {
  noNodes: 'Add and configure at least one node connected to End.',
  noEntryPoint: 'Set an entry point to test the pipeline.',
  noPathToEnd: 'Connect the entry point to End to test the pipeline.',
};

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

// Returns '' when the flow can be tested, otherwise the reason shown in the Test Pipeline tooltip
export const getTestBlockReason = yamlJsonObject => {
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

  return isEndReachable(edges, entryPoint) ? '' : TEST_BLOCK_REASONS.noPathToEnd;
};
