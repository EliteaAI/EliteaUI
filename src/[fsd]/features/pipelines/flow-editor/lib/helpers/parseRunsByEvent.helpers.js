import {
  CONDITION_NODE_ID_SUFFIX,
  DECISION_NODE_ID_SUFFIX,
  LegacyIntType,
  PipelineNodeTypes,
  PipelineStatus,
  RUN_STATE_NODE,
  StateVariableTypes,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { SocketMessageType } from '@/common/constants';
import { convertJsonToString } from '@/common/utils';

export const getInitialState = state =>
  Object.keys(state ?? {}).reduce((prev, key) => {
    const value =
      state[key] === StateVariableTypes.String ||
      state[key] === LegacyIntType ||
      state[key] === StateVariableTypes.Number
        ? ''
        : state[key] === StateVariableTypes.List
          ? []
          : {};
    return {
      ...prev,
      [key]: value,
    };
  }, {});

const findNode = (nodes, tool_name) =>
  nodes.find(node => {
    if (node.toolkit_name) {
      if (node.toolkit_name.length > tool_name.length) {
        return node.toolkit_name.startsWith(tool_name);
      } else {
        return tool_name.startsWith(node.toolkit_name);
      }
    } else {
      if (node.id.length > tool_name.length) {
        return (
          node.id.startsWith(tool_name) ||
          node.id.replaceAll(' ', '').startsWith(tool_name) ||
          (tool_name === node.tool && node.type === PipelineNodeTypes.Agent)
        );
      } else {
        return (
          tool_name.startsWith(node.id) ||
          tool_name.startsWith(node.id.replaceAll(' ', '')) ||
          (tool_name === node.tool && node.type === PipelineNodeTypes.Agent)
        );
      }
    }
  });

export const parseRunEvent = (
  event,
  nodes = [],
  interrupt_before = [],
  interrupt_after = [],
  isRunningPipeline,
  setIsRunningPipeline,
  runPipelineStatusNodeIdRef,
  activeNodeIdRef,
  runPipelineStatus,
  nextRunName,
) => {
  switch (event.type) {
    case SocketMessageType.AgentStart:
    case SocketMessageType.StartTask:
      if (!isRunningPipeline) {
        // One run started
        setIsRunningPipeline(true);
        const id = `Alita_Pipeline__State_${nextRunName}`;
        runPipelineStatus.current = {
          id,
          data: {
            label: nextRunName,
            timeline: [],
            status: PipelineStatus.InProgress,
          },
          type: RUN_STATE_NODE,
        };
        runPipelineStatusNodeIdRef.current = id;
      }
      break;
    case SocketMessageType.AgentLlmStart:
      if (isRunningPipeline) {
        // start a node
        const tool_name =
          event.response_metadata.metadata?.original_name || event.response_metadata.metadata?.langgraph_node;
        if (tool_name) {
          runPipelineStatus.current.data.timeline.push({
            id: tool_name,
            langgraph_node: event.response_metadata.metadata?.langgraph_node,
            status: PipelineStatus.InProgress,
            state: {},
            created_at: new Date().getTime(),
            tool_run_id: event.response_metadata.tool_run_id,
          });
          activeNodeIdRef.current = findNode(nodes, tool_name)?.id;
        }
      }
      break;
    case SocketMessageType.AgentLlmEnd:
      if (isRunningPipeline) {
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode => processNode.tool_run_id === event.response_metadata.tool_run_id,
        );
        if (foundProcessNode) {
          foundProcessNode.status = PipelineStatus.Completed;
        }
      }
      break;
    case SocketMessageType.AgentToolStart:
      if (isRunningPipeline) {
        // start a node
        // Support both old format (toolkit___tool) and new format (clean tool names)
        const toolNameRaw = event.response_metadata.tool_name;
        const tool_name =
          event.response_metadata.metadata?.toolkit_name ||
          event.response_metadata.toolkit_name ||
          (toolNameRaw.includes('___') ? toolNameRaw.split('___')[0] : toolNameRaw);
        if (tool_name) {
          runPipelineStatus.current.data.timeline.push({
            id: tool_name,
            langgraph_node: event.response_metadata.metadata?.langgraph_node,
            status: PipelineStatus.InProgress,
            state: {},
            created_at: new Date().getTime(),
            tool_run_id: event.response_metadata.tool_run_id,
          });
          const real_tool_name =
            tool_name === 'pyodide_sandbox' || tool_name === 'pyodide'
              ? event.response_metadata?.metadata?.langgraph_node
              : tool_name;
          activeNodeIdRef.current = findNode(nodes, real_tool_name)?.id;
        }
      }
      break;
    case SocketMessageType.AgentToolEnd:
      if (isRunningPipeline) {
        // end a node
        // Support both old format (toolkit___tool) and new format (clean tool names)
        const toolNameRaw = event.response_metadata.tool_name;
        const tool_name =
          event.response_metadata.metadata?.toolkit_name ||
          event.response_metadata.toolkit_name ||
          (toolNameRaw.includes('___') ? toolNameRaw.split('___')[0] : toolNameRaw);
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode =>
            processNode.id === tool_name || processNode.tool_run_id === event.response_metadata.tool_run_id,
        );
        if (foundProcessNode) {
          foundProcessNode.status = PipelineStatus.Completed;
        } else {
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].status = PipelineStatus.Completed;
          }
        }
      }
      break;
    case SocketMessageType.PipelineFinish:
      if (isRunningPipeline) {
        // One run finished successfully
        setIsRunningPipeline(false);
        runPipelineStatus.current.data.status = PipelineStatus.Completed;
        if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
          runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1].status =
            PipelineStatus.Completed;
        }
        activeNodeIdRef.current = PipelineNodeTypes.End;
      }
      break;
    case SocketMessageType.AgentOnTransitionalEdge:
      if (isRunningPipeline) {
        // avoid pipeline finalization after langraph agent execution
        if (
          event.response_metadata?.next_step === PipelineNodeTypes.End &&
          // event.response_metadata?.metadata?.langgraph_node !== 'agent' &&
          nodes.some(
            node =>
              node.id === event.response_metadata?.metadata?.langgraph_node ||
              (node.toolkit_name && node.toolkit_name === event.response_metadata?.metadata?.langgraph_node),
          )
        ) {
          // One run finished successfully
          setIsRunningPipeline(false);
          runPipelineStatus.current.data.status = PipelineStatus.Completed;
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].status = PipelineStatus.Completed;
          }
          activeNodeIdRef.current = PipelineNodeTypes.End;
        } else {
          const isOnTheCurrentNodeEdge =
            runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]
              ?.langgraph_node === event.response_metadata.metadata?.langgraph_node;
          if (isOnTheCurrentNodeEdge) {
            const source =
              runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]?.id;
            const target = event.response_metadata?.next_step;
            if (interrupt_after.includes(source) || interrupt_before.includes(target)) {
              const foundTargetId = findNode(nodes, target)?.id;
              runPipelineStatus.current.data.timeline.push({
                id: 'interrupt',
                source,
                target: foundTargetId || target,
                state: {
                  ...(event.response_metadata.state || {}),
                },
                created_at: new Date().getTime(),
              });
            } else {
              const lastTimelineItem =
                runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1];
              if (lastTimelineItem) {
                lastTimelineItem.state = {
                  ...event.response_metadata.state,
                };
              }
            }
          } else {
            // finish a node
            const tool_name =
              event.response_metadata.metadata?.original_name ||
              event.response_metadata.metadata?.langgraph_node;
            if (tool_name) {
              const foundNode = findNode(nodes, tool_name);
              if (foundNode) {
                runPipelineStatus.current.data.timeline.push({
                  id: tool_name,
                  langgraph_node: event.response_metadata.metadata?.langgraph_node,
                  status: PipelineStatus.Completed,
                  state: {
                    ...(event.response_metadata.state || {}),
                  },
                  created_at: new Date().getTime(),
                  tool_run_id: event.response_metadata.tool_run_id,
                });
                activeNodeIdRef.current = foundNode.id;
              }
            }
          }
        }
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode => processNode.langgraph_node === event.response_metadata.metadata?.langgraph_node,
        );
        if (foundProcessNode) {
          foundProcessNode.state = {
            ...event.response_metadata.state,
          };
        } else {
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].state = {
              ...event.response_metadata.state,
            };
          }
        }
      }
      break;
    case SocketMessageType.AgentOnConditionalEdge:
      if (isRunningPipeline) {
        const conditionNodeId = `${activeNodeIdRef.current}${CONDITION_NODE_ID_SUFFIX}`;
        activeNodeIdRef.current = conditionNodeId;
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode => processNode.langgraph_node === event.response_metadata.metadata?.langgraph_node,
        );
        if (foundProcessNode) {
          foundProcessNode.state = {
            ...event.response_metadata.state,
          };
        } else {
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].state = {
              ...event.response_metadata.state,
            };
          }
        }
      }
      break;
    case SocketMessageType.AgentOnDecisionEdge:
      if (isRunningPipeline) {
        const decisionNodeId = `${activeNodeIdRef.current}${DECISION_NODE_ID_SUFFIX}`;
        activeNodeIdRef.current = decisionNodeId;
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode => processNode.langgraph_node === event.response_metadata.metadata?.langgraph_node,
        );
        if (foundProcessNode) {
          foundProcessNode.state = {
            ...event.response_metadata.state,
          };
        } else {
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].state = {
              ...event.response_metadata.state,
            };
          }
        }
      }
      break;
    case SocketMessageType.AgentToolError:
      if (isRunningPipeline) {
        // One run failed
        // setIsRunningPipeline(false)
        // runPipelineStatus.current.data.status = PipelineStatus.Error
        // runPipelineStatus.current.data.error = convertJsonToString(event.content ?? '')
        // Support both old format (toolkit___tool) and new format (clean tool names)
        const toolNameRaw = event.response_metadata.tool_name || '';
        const tool_name =
          event.response_metadata.toolkit_name ||
          (toolNameRaw.includes('___') ? toolNameRaw.split('___')[0] : toolNameRaw);
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode =>
            processNode.id === tool_name || processNode.tool_run_id === event.response_metadata.tool_run_id,
        );
        if (foundProcessNode) {
          foundProcessNode.status = PipelineStatus.Error;
          foundProcessNode.error = convertJsonToString(event.content ?? '');
        } else {
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].status = PipelineStatus.Error;
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].error = convertJsonToString(event.content ?? '');
          }
        }
      }
      break;
    case SocketMessageType.AgentException:
      if (isRunningPipeline) {
        // One run failed
        setIsRunningPipeline(false);
        runPipelineStatus.current.data.status = PipelineStatus.Error;
        runPipelineStatus.current.data.error = convertJsonToString(event.content ?? '');
        if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
          runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1].status =
            PipelineStatus.Completed;
        }
      }
      break;
    default:
      if (isRunningPipeline && event.type.startsWith('agent_on')) {
        // pipeline node finish
        const foundProcessNode = runPipelineStatus.current.data.timeline.findLast(
          processNode => processNode.langgraph_node === event.response_metadata.metadata?.langgraph_node,
        );
        if (foundProcessNode) {
          foundProcessNode.state = {
            ...event.response_metadata.state,
          };
        } else {
          if (runPipelineStatus.current.data.timeline[runPipelineStatus.current.data.timeline.length - 1]) {
            runPipelineStatus.current.data.timeline[
              runPipelineStatus.current.data.timeline.length - 1
            ].state = {
              ...event.response_metadata.state,
            };
          }
        }
      }
      break;
  }
};
