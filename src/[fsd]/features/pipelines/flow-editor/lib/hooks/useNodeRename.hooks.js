import { useCallback, useContext, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { deepClone } from '@mui/x-data-grid/internals';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { useToast } from '@/[fsd]/shared/lib/hooks';

export const useNodeRename = ({ name, type }) => {
  const { toastError } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputtedName, setInputtedName] = useState(name);
  const { yamlJsonObject, setYamlJsonObject, setFlowNodes, setFlowEdges, isRunningPipeline } =
    useContext(FlowEditorContext);
  const { values: { version_details: { tools = [] } = {} } = {} } = useFormikContext();
  const toolNames = useMemo(() => tools?.map(tool => tool.toolkit_name || tool.name) || [], [tools]);

  const onStartEditing = useCallback(() => {
    if (type !== FlowEditorConstants.PipelineNodeTypes.Condition && !isRunningPipeline) {
      setIsEditingName(true);
    }
  }, [isRunningPipeline, type]);

  const onChange = useCallback(event => {
    setInputtedName(event.target.value);
  }, []);

  const onBlur = useCallback(() => {
    if (inputtedName !== name) {
      // Check for duplicate names (case-insensitive to spaces)
      // Exclude current node from check to allow minor space changes
      const foundNodeName = yamlJsonObject.nodes?.find(
        node => node.id !== name && node.id.replace(/\s/g, '') === inputtedName.replace(/\s/g, ''),
      );
      const foundToolName = toolNames.find(
        toolName => toolName.replace(/\s/g, '') === inputtedName.replace(/\s/g, ''),
      );
      if (foundNodeName || foundToolName) {
        toastError(
          foundNodeName
            ? 'The name has been used by other nodes, please input a new name!'
            : `The name conflicts with an existing toolkit name "${foundToolName}", please input a new name!`,
        );
        setInputtedName(name);
      } else {
        setYamlJsonObject(prev => {
          const newNodes = [...(prev?.nodes || [])].map(node => {
            const newNode =
              node.id === name
                ? {
                    ...node,
                    id: inputtedName,
                  }
                : {
                    ...node,
                  };
            if (node.condition && node.type !== FlowEditorConstants.PipelineNodeTypes.Router) {
              newNode.condition = {
                ...node.condition,
                condition_definition: node.condition.condition_definition?.replaceAll(name, inputtedName),
                conditional_outputs: node.condition.conditional_outputs?.map(item =>
                  item === name ? inputtedName : item,
                ),
                default_output:
                  node.condition.default_output === name ? inputtedName : node.condition.default_output,
              };
            } else if (node.decision) {
              newNode.decision = {
                ...node.decision,
                nodes: node.decision.nodes?.map(item => (item === name ? inputtedName : item)),
                default_output:
                  node.decision.default_output === name ? inputtedName : node.decision.default_output,
              };
            } else if (node.type === FlowEditorConstants.PipelineNodeTypes.Decision) {
              // Handle new-style Decision nodes
              newNode.nodes = node.nodes?.map(item => (item === name ? inputtedName : item));
              newNode.default_output = node.default_output === name ? inputtedName : node.default_output;
            } else if (node.transition === name) {
              newNode.transition = inputtedName;
            }
            return newNode;
          });
          return {
            ...(prev || {}),
            entry_point: prev.entry_point === name ? inputtedName : prev.entry_point,
            nodes: newNodes,
            interrupt_before: Array.isArray(prev.interrupt_before)
              ? prev.interrupt_before?.map(item => (item === name ? inputtedName : item))
              : prev.interrupt_before,
            interrupt_after: Array.isArray(prev.interrupt_after)
              ? prev.interrupt_after?.map(item => (item === name ? inputtedName : item))
              : prev.interrupt_after,
          };
        });
        setFlowNodes(prevNodes =>
          prevNodes.map(node => {
            const clonedNode = deepClone(node);
            const newNode =
              clonedNode.id === name
                ? {
                    ...clonedNode,
                    id: inputtedName,
                    data: {
                      ...clonedNode.data,
                      label: inputtedName,
                    },
                  }
                : {
                    ...clonedNode,
                  };
            if (clonedNode.data.condition) {
              newNode.data.condition = {
                ...clonedNode.data.condition,
                condition_definition: clonedNode.data.condition.condition_definition?.replaceAll(
                  name,
                  inputtedName,
                ),
                conditional_outputs: clonedNode.data.condition.conditional_outputs?.map(item =>
                  item === name ? inputtedName : item,
                ),
                default_output:
                  clonedNode.data.condition.default_output === name
                    ? inputtedName
                    : clonedNode.data.condition.default_output,
              };
            } else if (newNode.data.decision) {
              newNode.data.decision = {
                ...clonedNode.data.decision,
                nodes: clonedNode.data.decision.nodes?.map(item => (item === name ? inputtedName : item)),
                default_output:
                  clonedNode.data.decision.default_output === name
                    ? inputtedName
                    : clonedNode.data.decision.default_output,
              };
            } else if (clonedNode.data.type === FlowEditorConstants.PipelineNodeTypes.Decision) {
              // Handle new-style Decision nodes
              newNode.data.nodes = clonedNode.data.nodes?.map(item => (item === name ? inputtedName : item));
              newNode.data.default_output =
                clonedNode.data.default_output === name ? inputtedName : clonedNode.data.default_output;
            }
            return newNode;
          }),
        );
        setFlowEdges(prevEdges =>
          prevEdges.map(edge =>
            edge.source === name
              ? { ...edge, source: inputtedName }
              : edge.target === name
                ? { ...edge, target: inputtedName }
                : edge,
          ),
        );
      }
    }
    setIsEditingName(false);
  }, [
    inputtedName,
    name,
    setFlowEdges,
    setFlowNodes,
    setYamlJsonObject,
    toastError,
    toolNames,
    yamlJsonObject.nodes,
  ]);

  return { isEditingName, inputtedName, onStartEditing, onChange, onBlur };
};
