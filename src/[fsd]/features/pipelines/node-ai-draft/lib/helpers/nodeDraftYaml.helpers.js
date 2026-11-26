import { NodeYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const DRAFT_RENAME_ERROR = 'Rename the node in the Name field after applying.';

/**
 * The node YAML view rules (one node, same type, valid YAML), plus: a draft can't rename its node,
 * because Apply replaces the node in place (spec AC-14, AC-15).
 */
export const parseDraftYaml = (code, currentNode) => {
  const result = NodeYamlHelpers.parseNodeYaml(code, { currentNode, nodes: [currentNode] });
  if (result.error) return result;
  if (result.node.id !== currentNode.id) return { error: DRAFT_RENAME_ERROR };
  return result;
};
