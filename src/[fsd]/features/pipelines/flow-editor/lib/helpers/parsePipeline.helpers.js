import YAML from 'js-yaml';

import {
  CONDITION_NODE_ID_SUFFIX,
  DECISION_NODE_ID_SUFFIX,
  EDGE_PREFIX,
  HITL_HANDLE_ID_SUFFIX,
  ORIENTATION,
  PIPELINE_STATE,
  PipelineNodeTypes,
  ROUTER_HANDLE_ID_SUFFIX,
  STATE_INPUT,
  STATE_MESSAGES,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const parseState = yamlJson => {
  if (yamlJson?.state) {
    const firstTwoDefaultVariables = Object.entries(yamlJson.state)
      .filter(([key]) => key.toLowerCase() === STATE_INPUT || key.toLowerCase() === STATE_MESSAGES)
      .map(([key, value]) => ({
        id: key,
        name: key,
        type: typeof value === 'string' ? value : value?.type || 'str', // for old state, the format is variable: type; for new state, the format is variable: { type: str, value: 'str value' }
        value: typeof value === 'object' ? value?.value || '' : undefined,
        enabled: true,
      }));
    const leftVariables = Object.entries(yamlJson.state)
      .filter(([key]) => key.toLowerCase() !== STATE_INPUT && key.toLowerCase() !== STATE_MESSAGES)
      .map(([key, value]) => ({
        id: key,
        name: key,
        type: typeof value === 'string' ? value : value?.type || 'str', // for old state, the format is variable: type; for new state, the format is variable: { type: str, value: 'str value' }
        value: typeof value === 'object' ? value?.value || '' : undefined,
      }));
    return {
      id: PIPELINE_STATE,
      data: {
        label: 'State',
        variables: [...firstTwoDefaultVariables, ...leftVariables],
      },
      position: { x: 20, y: 20 },
      type: PIPELINE_STATE,
      draggable: false, // make the node fixed
    };
  }
  return null;
};

export const getNodePosition = (nodes, orientation = ORIENTATION.vertical) => {
  return orientation === ORIENTATION.horizontal
    ? {
        x: 60 + nodes.length * 670,
        y: 200,
      }
    : {
        x: 60,
        y: 200 + nodes.length * 670,
      };
};

const checkAndAddNode = ({ nodes, id, type, orientation, data }) => {
  if (!nodes.find(node => node.id === id)) {
    nodes.push({
      id,
      type,
      data,
      position: getNodePosition(nodes, orientation),
    });
  }
};

const checkAndAddEdge = ({ edges, edgeId, source, target, sourceHandle, targetHandle, data }) => {
  if (!edges.find(edge => edge.id === edgeId)) {
    edges.push({
      id: edgeId,
      source,
      sourceHandle,
      target,
      targetHandle,
      type: 'custom',
      data,
    });
  }
};

const handleConditionNode = ({
  yamlNodes,
  interrupt_before,
  interrupt_after,
  currentJsonNode,
  nodes,
  edges,
  orientation,
  rootNodeId,
}) => {
  const { id } = currentJsonNode;
  const { conditional_outputs = [], default_output = '' } = currentJsonNode.condition;
  const conditionNodeId = `${id}${CONDITION_NODE_ID_SUFFIX}`;
  checkAndAddNode({
    nodes,
    id: conditionNodeId,
    type: 'condition',
    data: {
      label: 'Condition',
      condition: { ...currentJsonNode.condition },
    },
    orientation,
  });
  const edgeId = `${EDGE_PREFIX}${id}---${conditionNodeId}`;
  checkAndAddEdge({
    edges,
    edgeId,
    source: id,
    target: conditionNodeId,
  });
  conditional_outputs
    ?.filter(item => !!item)
    .forEach(branch => {
      const branchEdgeId = `${EDGE_PREFIX}${conditionNodeId}---${branch}`;
      checkAndAddEdge({
        edges,
        edgeId: branchEdgeId,
        source: conditionNodeId,
        sourceHandle: 'conditional_outputs',
        target: branch,
        data: {
          label:
            interrupt_before?.includes(branch) || interrupt_after?.includes(id) ? 'interrupt' : undefined,
        },
      });
    });
  if (default_output) {
    const branchEdgeId = `${EDGE_PREFIX}${conditionNodeId}default_output---${default_output}`;
    checkAndAddEdge({
      edges,
      edgeId: branchEdgeId,
      source: conditionNodeId,
      sourceHandle: 'default_output',
      target: default_output,
      data: {
        label:
          interrupt_before?.includes(default_output) || interrupt_after?.includes(id)
            ? 'interrupt'
            : undefined,
      },
    });
  }
  [...(Array.isArray(conditional_outputs) ? conditional_outputs : []), default_output]
    .filter(branch => branch)
    .forEach(branch => {
      goThroughNodesTree(
        yamlNodes.filter(node => node.id !== rootNodeId),
        branch,
        nodes,
        edges,
        interrupt_after,
        interrupt_before,
      );
    });
};

const handleRouterNode = ({
  yamlNodes,
  interrupt_before,
  interrupt_after,
  rootNodeId,
  currentJsonNode,
  nodes,
  edges,
}) => {
  const { id } = currentJsonNode;
  const { routes = [], default_output = '' } = currentJsonNode;
  routes
    ?.filter(item => !!item)
    .forEach(route => {
      const branchEdgeId = `${EDGE_PREFIX}${id}---${route}`;
      checkAndAddEdge({
        edges,
        edgeId: branchEdgeId,
        source: id,
        sourceHandle: `${ROUTER_HANDLE_ID_SUFFIX}_routes`,
        target: route,
        data: {
          label: interrupt_before?.includes(route) || interrupt_after?.includes(id) ? 'interrupt' : undefined,
        },
      });
    });
  if (default_output) {
    const branchEdgeId = `${EDGE_PREFIX}${id}default_output---${default_output}`;
    checkAndAddEdge({
      edges,
      edgeId: branchEdgeId,
      source: id,
      sourceHandle: `${ROUTER_HANDLE_ID_SUFFIX}_default_output`,
      target: default_output,
      data: {
        label: interrupt_before?.includes(default_output) ? 'interrupt' : undefined,
      },
    });
  } else {
    const branchEdgeId = `${EDGE_PREFIX}${id}default_output---${PipelineNodeTypes.End}`;
    checkAndAddEdge({
      edges,
      edgeId: branchEdgeId,
      source: id,
      sourceHandle: `${ROUTER_HANDLE_ID_SUFFIX}_default_output`,
      target: PipelineNodeTypes.End,
    });
  }

  [...(Array.isArray(routes) ? routes : []), default_output]
    .filter(branch => branch)
    .forEach(branch => {
      goThroughNodesTree(
        yamlNodes.filter(node => node.id !== rootNodeId),
        branch,
        nodes,
        edges,
        interrupt_after,
        interrupt_before,
      );
    });
};

const handleHitlNode = ({
  yamlNodes,
  interrupt_before,
  interrupt_after,
  rootNodeId,
  currentJsonNode,
  nodes,
  edges,
}) => {
  const { id } = currentJsonNode;
  const routes = currentJsonNode.routes || {};

  Object.entries(routes)
    .filter(([, target]) => !!target)
    .forEach(([action, target]) => {
      const branchEdgeId = `${EDGE_PREFIX}${id}${action}---${target}`;
      checkAndAddEdge({
        edges,
        edgeId: branchEdgeId,
        source: id,
        sourceHandle: `${HITL_HANDLE_ID_SUFFIX}_${action}`,
        target,
        data: {
          label:
            target !== PipelineNodeTypes.End &&
            (interrupt_before?.includes(target) || interrupt_after?.includes(id))
              ? 'interrupt'
              : undefined,
        },
      });
    });

  Object.values(routes)
    .filter(branch => branch && branch !== PipelineNodeTypes.End)
    .forEach(branch => {
      goThroughNodesTree(
        yamlNodes.filter(node => node.id !== rootNodeId),
        branch,
        nodes,
        edges,
        interrupt_after,
        interrupt_before,
      );
    });
};

const handleDecisionNode = ({
  yamlNodes,
  interrupt_before,
  interrupt_after,
  currentJsonNode,
  nodes,
  edges,
  orientation,
  rootNodeId,
}) => {
  const { id } = currentJsonNode;
  const { nodes: decisional_outputs = [], default_output = '' } = currentJsonNode.decision;
  const decisionNodeId = `${id}${DECISION_NODE_ID_SUFFIX}`;
  checkAndAddNode({
    nodes,
    id: decisionNodeId,
    type: PipelineNodeTypes.Decision,
    data: {
      label: 'Decision(deprecated inline decision)',
      decision: { ...currentJsonNode.decision },
    },
    orientation,
  });
  const edgeId = `${EDGE_PREFIX}${id}---${decisionNodeId}`;
  checkAndAddEdge({
    edges,
    edgeId,
    source: id,
    target: decisionNodeId,
  });
  decisional_outputs
    ?.filter(item => !!item)
    .forEach(branch => {
      const branchEdgeId = `${EDGE_PREFIX}${decisionNodeId}---${branch}`;
      checkAndAddEdge({
        edges,
        edgeId: branchEdgeId,
        source: decisionNodeId,
        sourceHandle: 'nodes',
        target: branch,
        data: {
          label:
            interrupt_before?.includes(branch) || interrupt_after?.includes(id) ? 'interrupt' : undefined,
        },
      });
    });
  if (default_output) {
    const branchEdgeId = `${EDGE_PREFIX}${decisionNodeId}default_output---${default_output}`;
    checkAndAddEdge({
      edges,
      edgeId: branchEdgeId,
      source: decisionNodeId,
      sourceHandle: 'default_output',
      target: default_output,
      data: {
        label:
          interrupt_before?.includes(default_output) || interrupt_after?.includes(id)
            ? 'interrupt'
            : undefined,
      },
    });
  }
  [...(Array.isArray(decisional_outputs) ? decisional_outputs : []), default_output]
    .filter(branch => branch)
    .forEach(branch => {
      goThroughNodesTree(
        yamlNodes.filter(node => node.id !== rootNodeId),
        branch,
        nodes,
        edges,
        interrupt_after,
        interrupt_before,
      );
    });
};

const handleNewDecisionNode = ({
  yamlNodes,
  interrupt_before,
  interrupt_after,
  currentJsonNode,
  nodes,
  edges,
  orientation,
  rootNodeId,
}) => {
  const { id } = currentJsonNode;
  const { nodes: decisional_outputs = [], default_output = '' } = currentJsonNode;
  checkAndAddNode({
    nodes,
    id,
    type: PipelineNodeTypes.Decision,
    data: {
      decision: { ...currentJsonNode.decision },
    },
    orientation,
  });
  decisional_outputs
    ?.filter(item => !!item)
    .forEach(branch => {
      const branchEdgeId = `${EDGE_PREFIX}${id}---${branch}`;
      checkAndAddEdge({
        edges,
        edgeId: branchEdgeId,
        source: id,
        sourceHandle: 'nodes',
        target: branch,
        data: {
          label:
            interrupt_before?.includes(branch) || interrupt_after?.includes(id) ? 'interrupt' : undefined,
        },
      });
    });
  if (default_output) {
    const branchEdgeId = `${EDGE_PREFIX}${id}default_output---${default_output}`;
    checkAndAddEdge({
      edges,
      edgeId: branchEdgeId,
      source: id,
      sourceHandle: 'default_output',
      target: default_output,
      data: {
        label:
          interrupt_before?.includes(default_output) || interrupt_after?.includes(id)
            ? 'interrupt'
            : undefined,
      },
    });
  }
  [...(Array.isArray(decisional_outputs) ? decisional_outputs : []), default_output]
    .filter(branch => branch)
    .forEach(branch => {
      goThroughNodesTree(
        yamlNodes.filter(node => node.id !== rootNodeId),
        branch,
        nodes,
        edges,
        interrupt_after,
        interrupt_before,
      );
    });
};

const handleTransitionNode = ({
  yamlNodes,
  interrupt_before,
  interrupt_after,
  currentJsonNode,
  nodes,
  edges,
  rootNodeId,
}) => {
  const { id } = currentJsonNode;
  const edgeId = `${EDGE_PREFIX}${id}---${currentJsonNode.transition}`;
  checkAndAddEdge({
    edges,
    edgeId,
    source: id,
    target: currentJsonNode.transition,
    data: {
      label:
        interrupt_after?.includes(id) || interrupt_before?.includes(currentJsonNode.transition)
          ? 'interrupt'
          : undefined,
    },
  });
  goThroughNodesTree(
    yamlNodes.filter(node => node.id !== rootNodeId),
    currentJsonNode.transition,
    nodes,
    edges,
    interrupt_after,
    interrupt_before,
  );
};

const goThroughNodesTree = (
  yamlNodes,
  rootNodeId,
  nodes,
  edges,
  interrupt_after,
  interrupt_before,
  orientation,
) => {
  const currentJsonNode = yamlNodes.find(node => node?.id === rootNodeId);
  let isEnd = !currentJsonNode;
  while (!isEnd) {
    const { id, type } = currentJsonNode;
    checkAndAddNode({ nodes, id, type, data: { label: id }, orientation });
    if (currentJsonNode.type !== PipelineNodeTypes.Router) {
      if (currentJsonNode.type === PipelineNodeTypes.Hitl) {
        handleHitlNode({
          yamlNodes,
          interrupt_before,
          interrupt_after,
          rootNodeId,
          currentJsonNode,
          nodes,
          edges,
        });
        isEnd = true;
      } else if (currentJsonNode.condition) {
        // legacy condition node
        handleConditionNode({
          yamlNodes,
          interrupt_before,
          interrupt_after,
          currentJsonNode,
          nodes,
          edges,
          orientation,
          rootNodeId,
        });
        isEnd = true;
      } else if (currentJsonNode.decision) {
        // legacy decision node
        handleDecisionNode({
          yamlNodes,
          interrupt_before,
          interrupt_after,
          currentJsonNode,
          nodes,
          edges,
          orientation,
          rootNodeId,
        });
        isEnd = true;
      } else {
        if (currentJsonNode.type === PipelineNodeTypes.Decision) {
          // new decision node
          handleNewDecisionNode({
            yamlNodes,
            interrupt_before,
            interrupt_after,
            currentJsonNode,
            nodes,
            edges,
            orientation,
            rootNodeId,
          });
          isEnd = true;
        } else {
          if (currentJsonNode.transition && currentJsonNode.transition !== PipelineNodeTypes.End) {
            handleTransitionNode({
              yamlNodes,
              interrupt_before,
              interrupt_after,
              currentJsonNode,
              nodes,
              edges,
              rootNodeId,
            });
            isEnd = true;
          } else {
            const edgeId = `${EDGE_PREFIX}${id}---AlitaPipelineEnd`;
            checkAndAddEdge({
              edges,
              edgeId,
              source: id,
              target: PipelineNodeTypes.End,
            });
            isEnd = true;
          }
        }
      }
    } else {
      handleRouterNode({
        yamlNodes,
        interrupt_before,
        interrupt_after,
        rootNodeId,
        currentJsonNode,
        nodes,
        edges,
      });
      isEnd = true;
    }
  }
};

const parseNodes = (yamlJson, orientation = ORIENTATION.vertical) => {
  const nodes = [
    {
      id: PipelineNodeTypes.End,
      type: PipelineNodeTypes.End,
      data: {
        label: 'End',
      },
      position: getNodePosition([], orientation),
    },
  ];
  const edges = [];
  if (yamlJson) {
    const yamlNodes = [...(yamlJson.nodes?.filter(node => node) || [])];
    const { entry_point, interrupt_after, interrupt_before } = yamlJson;
    const realInterruptBefore = Array.isArray(interrupt_before) ? interrupt_before : [];
    const realInterruptAfter = Array.isArray(interrupt_after) ? interrupt_after : [];
    goThroughNodesTree(
      yamlNodes,
      entry_point,
      nodes,
      edges,
      realInterruptAfter,
      realInterruptBefore,
      orientation,
    );
    yamlNodes.forEach(node => {
      if (!nodes.find(parsedNode => parsedNode.id === node.id)) {
        goThroughNodesTree(
          yamlNodes,
          node?.id,
          nodes,
          edges,
          realInterruptAfter,
          realInterruptBefore,
          orientation,
        );
      }
    });
  }

  return {
    nodes,
    edges,
  };
};

export const parseYaml = (yamlJson, orientation = ORIENTATION.vertical) => {
  const state = parseState(yamlJson);
  const { nodes, edges } = parseNodes(yamlJson, orientation);
  const types = Object.values(PipelineNodeTypes);
  const mappedNodes = nodes.map(node =>
    types.find(type => node.type === type)
      ? node
      : {
          ...node,
          type: PipelineNodeTypes.Default,
          originalAlitaType: node.type,
          data: {
            ...node.data,
            type: node.type,
          },
        },
  );

  return {
    nodes: [...mappedNodes],
    state,
    edges: [...edges],
  };
};

export const migerateLegacyNodes = yamlJson => {
  if (!yamlJson || !Array.isArray(yamlJson.nodes)) {
    return yamlJson;
  }
  const migratedNodes = [];
  const flowNodesToRemove = [];
  if (!yamlJson.nodes?.find(node => node.decision)) {
    return {
      yamlJson,
      flowNodesToRemove,
    };
  }
  yamlJson.nodes.forEach(node => {
    if (node.decision) {
      const { decision, ...rest } = node;
      flowNodesToRemove.push(`${node.id}${DECISION_NODE_ID_SUFFIX}`);
      const decisionNodeId = FlowEditorHelpers.getInitialNodeId(PipelineNodeTypes.Decision, [
        ...yamlJson.nodes,
        ...migratedNodes,
      ]);
      migratedNodes.push({
        ...rest,
        transition: decisionNodeId,
      });
      const { decisional_inputs, ...left } = decision;
      migratedNodes.push({
        ...left,
        input: decisional_inputs,
        type: PipelineNodeTypes.Decision,
        id: decisionNodeId,
      });
    } else {
      migratedNodes.push(node);
    }
  });

  return {
    yamlJson: {
      ...yamlJson,
      nodes: migratedNodes,
    },
    flowNodesToRemove,
  };
};

export const extractPipelineNodeTypes = instructions => {
  if (!instructions) return null;

  try {
    const parsedYaml = YAML.load(instructions);
    if (!parsedYaml?.nodes || !Array.isArray(parsedYaml.nodes)) return null;

    const nodeTypeCounts = {};
    let totalNodeCount = 0;

    parsedYaml.nodes.forEach(node => {
      if (node?.type) {
        const nodeType = node.type;
        nodeTypeCounts[nodeType] = (nodeTypeCounts[nodeType] || 0) + 1;
        totalNodeCount++;
      }
    });

    return { nodeTypes: nodeTypeCounts, totalNodeCount };
  } catch {
    return null;
  }
};
