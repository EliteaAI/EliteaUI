import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { DumpYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import RouteDefinitions from '@/routes';
import { actions } from '@/slices/pipeline.js';

import { useIsFrom, useIsFromPipelineDetail } from '../useIsFromSpecificPageHooks';

export default function usePipelineToolsChanges() {
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
    },
    [dispatch, setYamlCode, yamlCode],
  );

  const onRemoveTool = useCallback(
    tool => {
      if (isFromPipeline && yamlJsonObject.nodes?.length) {
        if (tool.type === ToolTypes.application.value) {
          if (tool.agent_type === 'pipeline') {
            // pipeliine tool
            if (
              yamlJsonObject.nodes.find(
                node =>
                  (node.type === PipelineNodeTypes.Pipeline && node.tool === tool.name) ||
                  (node.type === PipelineNodeTypes.LLM && node.tool_names?.[tool.name]),
              )
            ) {
              const newYamlJsonObject = { ...yamlJsonObject };
              newYamlJsonObject.nodes = [
                ...newYamlJsonObject.nodes.map(node => {
                  return node.type === PipelineNodeTypes.Pipeline && node.tool === tool.name
                    ? {
                        ...node,
                        tool: undefined,
                      }
                    : node.type === PipelineNodeTypes.LLM && node.tool_names?.[tool.name]
                      ? {
                          ...node,
                          tool_names: Object.keys(node.tool_names || {})
                            .filter(key => key !== tool.name)
                            .reduce((acc, key) => {
                              acc[key] = node.tool_names[key];
                              return acc;
                            }, {}),
                        }
                      : node;
                }),
              ];
              setYamlJsonObject(newYamlJsonObject);
            }
          } else {
            // agent tool
            if (
              yamlJsonObject.nodes.find(
                node =>
                  (node.type === PipelineNodeTypes.Agent && node.tool === tool.name) ||
                  (node.type === PipelineNodeTypes.LLM && node.tool_names?.[tool.name]),
              )
            ) {
              const newYamlJsonObject = { ...yamlJsonObject };
              newYamlJsonObject.nodes = [
                ...newYamlJsonObject.nodes.map(node => {
                  return node.type === PipelineNodeTypes.Agent && node.tool === tool.name
                    ? {
                        ...node,
                        tool: undefined,
                        input_mapping: undefined,
                      }
                    : node.type === PipelineNodeTypes.LLM && node.tool_names?.[tool.name]
                      ? {
                          ...node,
                          tool_names: Object.keys(node.tool_names || {})
                            .filter(key => key !== tool.name)
                            .reduce((acc, key) => {
                              acc[key] = node.tool_names[key];
                              return acc;
                            }, {}),
                        }
                      : node;
                }),
              ];
              setYamlJsonObject(newYamlJsonObject);
            }
          }
        } else {
          // toolkit tool
          const toolkitName = tool.toolkit_name || getToolkitNameFromSchema(tool);
          if (
            yamlJsonObject.nodes.find(
              node =>
                (node.type !== PipelineNodeTypes.Agent &&
                  node.type !== PipelineNodeTypes.Pipeline &&
                  node.type !== PipelineNodeTypes.LLM &&
                  node.toolkit_name === toolkitName) ||
                (node.type === PipelineNodeTypes.LLM && node.tool_names?.[toolkitName]),
            )
          ) {
            const newYamlJsonObject = { ...yamlJsonObject };
            newYamlJsonObject.nodes = [
              ...newYamlJsonObject.nodes.map(node => {
                return node.type !== PipelineNodeTypes.Agent &&
                  node.type !== PipelineNodeTypes.Pipeline &&
                  node.toolkit_name === toolkitName
                  ? {
                      ...node,
                      tool: undefined,
                      toolkit_name: undefined,
                      input_mapping: undefined,
                    }
                  : node.type === PipelineNodeTypes.LLM && node.tool_names?.[toolkitName]
                    ? {
                        ...node,
                        tool_names: Object.keys(node.tool_names || {})
                          .filter(key => key !== toolkitName)
                          .reduce((acc, key) => {
                            acc[key] = node.tool_names[key];
                            return acc;
                          }, {}),
                      }
                    : node;
              }),
            ];
            setYamlJsonObject(newYamlJsonObject);
          }
        }
      }
    },
    [getToolkitNameFromSchema, isFromPipeline, setYamlJsonObject, yamlJsonObject],
  );

  return { onRemoveTool };
}
