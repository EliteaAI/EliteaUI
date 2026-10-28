import { useCallback, useContext } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  getNodeNameError,
  renameNodeInEdges,
  renameNodeInFlowNodes,
  renameNodeInYaml,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/nodeRename.helpers';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';

import { useNodeToolNames } from './useNodeToolNames.hooks';

// `isLocked` blocks renaming nodes whose shown name isn't their YAML id (legacy inline decisions)
export const useNodeRename = ({ name, type, onRenamed, isLocked = false }) => {
  const { yamlJsonObject, setYamlJsonObject, setFlowNodes, setFlowEdges, isRunningPipeline, disabled } =
    useContext(FlowEditorContext);
  const toolNames = useNodeToolNames();

  const canRename =
    type !== FlowEditorConstants.PipelineNodeTypes.Condition && !isLocked && !isRunningPipeline && !disabled;

  const getNameError = useCallback(
    newName => getNodeNameError({ newName, currentName: name, nodes: yamlJsonObject.nodes, toolNames }),
    [name, toolNames, yamlJsonObject.nodes],
  );

  // Returns the validation error, or null once the node and every reference to it are renamed
  const renameNode = useCallback(
    newName => {
      if (!canRename || newName === name) return null;

      const error = getNameError(newName);
      if (error) return error;

      setYamlJsonObject(prev => renameNodeInYaml(prev, name, newName));
      setFlowNodes(prevNodes => renameNodeInFlowNodes(prevNodes, name, newName));
      setFlowEdges(prevEdges => renameNodeInEdges(prevEdges, name, newName));
      onRenamed?.(newName);
      return null;
    },
    [canRename, getNameError, name, onRenamed, setFlowEdges, setFlowNodes, setYamlJsonObject],
  );

  return { canRename, getNameError, renameNode };
};
