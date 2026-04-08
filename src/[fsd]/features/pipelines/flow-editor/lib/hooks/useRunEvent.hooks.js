import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { ParseRunsByEventHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const useRunEvent = (setFlowNodes, yamlJsonObject) => {
  const [pipelineRunNodes, setPipelineRunNodes] = useState([]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const runPipelineStatusNodeIdRef = useRef('');
  const activeNodeIdRef = useRef('');
  const runPipelineStatus = useRef(null);

  const nextRunName = useMemo(() => {
    for (let index = 0; index < pipelineRunNodes.length + 1; index++) {
      const newName = `Run ${index + 1} details`;
      if (!pipelineRunNodes.find(node => node.data.label === newName)) {
        return newName;
      }
    }
    return 'Run 1 details';
  }, [pipelineRunNodes]);

  const deleteRunNode = useCallback(id => {
    setPipelineRunNodes(pervNodes => pervNodes.filter(node => node.id !== id));
  }, []);

  const clearRunParseStatus = useCallback(() => {
    activeNodeIdRef.current = '';
    runPipelineStatusNodeIdRef.current = '';
    runPipelineStatus.current = null;
  }, []);

  const onResetRunParseStatus = useCallback(() => {
    setIsRunningPipeline(false);
    clearRunParseStatus();
  }, [clearRunParseStatus]);

  const onStopRun = useCallback(
    id => {
      onResetRunParseStatus();
      setPipelineRunNodes(prev =>
        prev.map(node => {
          if (id !== node.id) {
            return node;
          } else {
            return {
              ...node,
              data: {
                ...(node.data || {}),
                status: FlowEditorConstants.PipelineStatus.Stopped,
              },
            };
          }
        }),
      );
      setFlowNodes(prev =>
        prev.map(node => ({
          ...node,
          data: {
            ...(node.data || {}),
            isPerforming: undefined,
          },
        })),
      );
    },
    [onResetRunParseStatus, setFlowNodes],
  );

  const deleteAllRunNodes = useCallback(() => {
    setPipelineRunNodes([]);
    onResetRunParseStatus();
    setFlowNodes(prev =>
      prev.map(node => ({
        ...node,
        data: {
          ...(node.data || {}),
          isPerforming: undefined,
        },
      })),
    );
  }, [onResetRunParseStatus, setFlowNodes]);

  const onRcvAgentEvent = useCallback(
    event => {
      ParseRunsByEventHelpers.parseRunEvent(
        event,
        yamlJsonObject.nodes || [],
        yamlJsonObject.interrupt_before || [],
        yamlJsonObject.interrupt_after || [],
        isRunningPipeline,
        setIsRunningPipeline,
        runPipelineStatusNodeIdRef,
        activeNodeIdRef,
        runPipelineStatus,
        nextRunName,
      );
      if (runPipelineStatus.current) {
        setFlowNodes(prev => {
          const foundActiveNode = prev.find(
            node =>
              node.id === activeNodeIdRef.current || node.id.replaceAll(' ', '') === activeNodeIdRef.current,
          );
          return prev.map(node => ({
            ...node,
            data: {
              ...(node.data || {}),
              isPerforming: node.id === foundActiveNode?.id ? true : undefined,
            },
          }));
        });
        setPipelineRunNodes(prev => {
          if (!runPipelineStatus.current) {
            return prev;
          }
          if (prev.find(node => node.id === runPipelineStatus.current.id)) {
            return prev.map(node =>
              node.id !== runPipelineStatus.current.id
                ? node
                : {
                    ...node,
                    ...runPipelineStatus.current,
                    data: {
                      ...runPipelineStatus.current.data,
                      timeline: [...runPipelineStatus.current.data.timeline],
                    },
                  },
            );
          } else {
            return [
              ...prev,
              {
                ...runPipelineStatus.current,
                data: {
                  ...runPipelineStatus.current.data,
                  timeline: [...runPipelineStatus.current.data.timeline],
                },
              },
            ];
          }
        });
      }
    },
    [
      isRunningPipeline,
      nextRunName,
      setFlowNodes,
      yamlJsonObject.interrupt_after,
      yamlJsonObject.interrupt_before,
      yamlJsonObject.nodes,
    ],
  );

  useEffect(() => {
    if (!isRunningPipeline) {
      setTimeout(() => {
        runPipelineStatus.current = null;
      }, 300);
    }
  }, [isRunningPipeline]);

  return {
    deleteRunNode,
    deleteAllRunNodes,
    onStopRun,
    onRcvAgentEvent,
    onResetRunParseStatus,
    isRunningPipeline,
    pipelineRunNodes,
  };
};
