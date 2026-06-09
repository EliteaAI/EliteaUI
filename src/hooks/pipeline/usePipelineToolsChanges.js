import { useCallback } from 'react';

import YAML from 'js-yaml';
import { useDispatch, useSelector } from 'react-redux';

import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { DumpYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import RouteDefinitions from '@/routes';
import { actions } from '@/slices/pipeline.js';

import { useIsFrom, useIsFromPipelineDetail } from '../useIsFromSpecificPageHooks';

// Removes a single key from a tool_names object.
const removeToolName = (toolNames, name) =>
  Object.keys(toolNames).reduce((acc, key) => {
    if (key !== name) acc[key] = toolNames[key];
    return acc;
  }, {});

// Returns true if a node is affected by removing the given tool.
// `toolkitName` is pre-resolved by the caller (null for application tools).
const isNodeAffectedByRemoval = (node, tool, toolkitName) => {
  if (tool.type === ToolTypes.application.value) {
    const matchNodeType =
      tool.agent_type === 'pipeline' ? PipelineNodeTypes.Pipeline : PipelineNodeTypes.Agent;
    return (
      (node.type === matchNodeType && node.tool === tool.name) ||
      (node.type === PipelineNodeTypes.LLM && node.tool_names?.[tool.name])
    );
  }
  return (
    (node.type !== PipelineNodeTypes.Agent &&
      node.type !== PipelineNodeTypes.Pipeline &&
      node.type !== PipelineNodeTypes.LLM &&
      node.toolkit_name === toolkitName) ||
    (node.type === PipelineNodeTypes.LLM && node.tool_names?.[toolkitName])
  );
};

// Pure function — applies toolkit/agent/pipeline tool removal to a nodes array.
// `toolkitName` is pre-resolved by the caller (null for application tools).
const applyToolRemovalToNodes = (nodes, tool, toolkitName) => {
  if (tool.type === ToolTypes.application.value) {
    const isPipelineTool = tool.agent_type === 'pipeline';
    const matchNodeType = isPipelineTool ? PipelineNodeTypes.Pipeline : PipelineNodeTypes.Agent;
    return nodes.map(node => {
      if (node.type === matchNodeType && node.tool === tool.name) {
        return isPipelineTool
          ? { ...node, tool: undefined }
          : { ...node, tool: undefined, input_mapping: undefined };
      }
      if (node.type === PipelineNodeTypes.LLM && node.tool_names?.[tool.name]) {
        return { ...node, tool_names: removeToolName(node.tool_names, tool.name) };
      }
      return node;
    });
  }
  return nodes.map(node => {
    if (
      node.type !== PipelineNodeTypes.Agent &&
      node.type !== PipelineNodeTypes.Pipeline &&
      node.toolkit_name === toolkitName
    ) {
      return { ...node, tool: undefined, toolkit_name: undefined, input_mapping: {} };
    }
    if (node.type === PipelineNodeTypes.LLM && node.tool_names?.[toolkitName]) {
      return { ...node, tool_names: removeToolName(node.tool_names, toolkitName) };
    }
    return node;
  });
};

const usePipelineToolsChanges = () => {
  const isFromPipelineDetail = useIsFromPipelineDetail();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const { yamlJsonObject, yamlCode } = useSelector(state => state.pipeline);
  const dispatch = useDispatch();
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();

  // Determine if we're editing a pipeline:
  // 1. Explicitly on pipeline detail pages, OR
  // 2. In chat AND there's actual pipeline YAML data (has nodes in yamlJsonObject)
  //    This distinguishes pipeline editing from agent editing in chat
  const hasPipelineData = yamlJsonObject && yamlJsonObject.nodes && yamlJsonObject.nodes.length > 0;
  const isFromPipeline = isFromPipelineDetail || (isFromChat && hasPipelineData);

  const setYamlCode = useCallback(
    code => {
      dispatch(actions.setYamlCode(code));
    },
    [dispatch],
  );

  const setYamlJsonObject = useCallback(
    newYamlJsonObject => {
      dispatch(actions.setYamlJsonObject({ yamlJsonObject: newYamlJsonObject }));
      const yamlString = DumpYamlHelpers.dumpYaml(newYamlJsonObject);
      if (Object.keys(newYamlJsonObject).length && yamlString !== yamlCode) {
        setYamlCode(yamlString);
      }
      return yamlString;
    },
    [dispatch, setYamlCode, yamlCode],
  );

  const onRemoveTool = useCallback(
    tool => {
      if (!isFromPipeline || !yamlJsonObject.nodes?.length) return null;

      const toolkitName =
        tool.type !== ToolTypes.application.value
          ? tool.toolkit_name || getToolkitNameFromSchema(tool)
          : null;

      // Early exit if no nodes reference this tool
      if (!yamlJsonObject.nodes.some(node => isNodeAffectedByRemoval(node, tool, toolkitName))) {
        return null;
      }

      const newNodes = applyToolRemovalToNodes(yamlJsonObject.nodes, tool, toolkitName);
      const newYamlJsonObject = { ...yamlJsonObject, nodes: newNodes };
      const newYamlCode = setYamlJsonObject(newYamlJsonObject);
      return newYamlCode;
    },
    [getToolkitNameFromSchema, isFromPipeline, setYamlJsonObject, yamlJsonObject],
  );

  // Syncs initState with a clean YAML string (e.g. after auto-save) so Discard
  // resets to the saved state and does not re-include unsaved flow editor changes.
  const syncInitStateWithCleanYaml = useCallback(
    cleanYamlCode => {
      try {
        const cleanYamlJsonObject = YAML.load(cleanYamlCode);
        dispatch(actions.syncInitYamlJsonObject({ yamlJsonObject: cleanYamlJsonObject }));
      } catch {
        // ignore parse errors — initState stays at its last value
      }
    },
    [dispatch],
  );

  // Computes clean YAML by applying the toolkit removal to the given initial YAML string
  // (not to the current Redux state), so no unsaved changes bleed into the result.
  const getCleanYamlForInitial = useCallback(
    (initialYamlCode, tool) => {
      if (!initialYamlCode) return null;
      let baseYamlJson;
      try {
        baseYamlJson = YAML.load(initialYamlCode);
      } catch {
        return null;
      }
      if (!baseYamlJson?.nodes?.length) return null;

      const toolkitName =
        tool.type !== ToolTypes.application.value
          ? tool.toolkit_name || getToolkitNameFromSchema(tool)
          : null;

      // No nodes in the saved YAML reference this toolkit — nothing to clean, skip save.
      if (!baseYamlJson.nodes.some(node => isNodeAffectedByRemoval(node, tool, toolkitName))) {
        return null;
      }

      const newNodes = applyToolRemovalToNodes(baseYamlJson.nodes, tool, toolkitName);
      return DumpYamlHelpers.dumpYaml({ ...baseYamlJson, nodes: newNodes });
    },
    [getToolkitNameFromSchema],
  );

  return { onRemoveTool, isFromPipeline, getCleanYamlForInitial, syncInitStateWithCleanYaml };
};

export default usePipelineToolsChanges;
