import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

export const isConditionNode = node => node.type === FlowEditorConstants.PipelineNodeTypes.Condition;

export const isDecisionNode = node => node.type === FlowEditorConstants.PipelineNodeTypes.Decision;

export const isLegacyDecisionNode = node =>
  isDecisionNode(node) && node.id.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX);

export const isGhostNode = node => node.type === FlowEditorConstants.PipelineNodeTypes.Ghost;

export const isFromConditionNode = connection =>
  connection.source.endsWith(FlowEditorConstants.CONDITION_NODE_ID_SUFFIX);

export const isConnectToConditionNode = connection =>
  connection.target.endsWith(FlowEditorConstants.CONDITION_NODE_ID_SUFFIX);

export const isFromDecisionNode = ({ connection, yamlJsonObjectRef }) =>
  connection.source.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX) || // legacy decision node
  yamlJsonObjectRef.current?.nodes?.find(node => node.id === connection.source)?.type ===
    FlowEditorConstants.PipelineNodeTypes.Decision; // new decision node

export const isConnectToDecisionNode = ({ connection, yamlJsonObjectRef }) =>
  connection.target.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX) || // legacy decision node
  yamlJsonObjectRef.current?.nodes?.find(node => node.id === connection.target)?.type ===
    FlowEditorConstants.PipelineNodeTypes.Decision; // new decision node

export const isFromRouterNode = connection =>
  connection.sourceHandle?.startsWith(FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX);

export const isHitlHandle = handle => handle?.startsWith(FlowEditorConstants.HITL_HANDLE_ID_SUFFIX);

export const isFromHitlNode = connection => isHitlHandle(connection.sourceHandle);

export const isConnectToEndNode = connection =>
  connection.target === FlowEditorConstants.PipelineNodeTypes.End;

export const cannotConnectToConditionOrDecision = ({ connection, yamlJsonObjectRef }) =>
  isConnectToConditionNode(connection) || isConnectToDecisionNode({ connection, yamlJsonObjectRef });

// ===== Handle Type Checking Functions =====

export const isRouterHandle = handle => handle?.startsWith(FlowEditorConstants.ROUTER_HANDLE_ID_SUFFIX);

export const isDefaultOutputHandle = handle => handle?.endsWith(FlowEditorConstants.DEFAULT_OUTPUT);
