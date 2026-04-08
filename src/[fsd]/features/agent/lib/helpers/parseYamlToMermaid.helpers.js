import YAML from 'js-yaml';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

// Sanitize ID for Mermaid compatibility (alphanumeric and underscore only)
const sanitizeId = id => id?.replace(/[^a-zA-Z0-9_]/g, '_') || '';

// Generate mermaid diagram line
const addMermaidLine = (from, to, label = '') => {
  const labelPart = label ? `|${label}|` : '';
  return `  ${from} -->${labelPart} ${to}\n`;
};

const goThroughJinjaNodeTree = (conditionId, conditionExpression, tree, result) => {
  if (tree.length === 1) {
    if (tree[0].type === 'text') {
      const branchId = sanitizeId(tree[0].value?.trim());
      const realCondition = conditionExpression.trim().replaceAll('|', ' or \n').replaceAll('"', '');
      result.mermaidDiagram += addMermaidLine(conditionId, branchId, realCondition);
    }
  } else {
    tree.forEach(node => {
      switch (node.type) {
        case 'if':
        case 'elif': {
          const newConditionExpression = conditionExpression
            ? `${conditionExpression} AND ${node.condition}`
            : node.condition;
          goThroughJinjaNodeTree(conditionId, newConditionExpression, node.children, result);
          break;
        }
        case 'else':
          goThroughJinjaNodeTree(conditionId, conditionExpression, node.children, result);
          break;
        default:
          break;
      }
    });
  }
};

const parseJinjaCondition = (input, conditionId) => {
  const tokens = tokenize(input);
  const tree = parseTokens(tokens);
  const result = {
    mermaidDiagram: '',
  };
  goThroughJinjaNodeTree(conditionId, '', tree, result);

  return result.mermaidDiagram;
};

const tokenize = input => {
  const tokenRegex = /({%.*?%})|({{.*?}})|([^{]+)|({#.*?#})/gs;
  const tokens = [];
  let match;

  while ((match = tokenRegex.exec(input)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'block', value: match[1].trim() });
    } else if (match[2]) {
      tokens.push({ type: 'variable', value: match[2].trim() });
    } else if (match[3]) {
      const text = match[3].trim();
      if (text) {
        tokens.push({ type: 'text', value: text });
      }
    } else if (match[4]) {
      tokens.push({ type: 'comment', value: match[4].trim() });
    }
  }

  return tokens;
};

const parseTokens = tokens => {
  const stack = [];
  const children = [];

  stack.push(children);

  // Helper to get current stack top
  const getCurrentLevel = () => stack[stack.length - 1];

  // Helper to add conditional block node
  const addConditionalNode = (type, condition = null) => {
    const node = { type, children: [], ...(condition && { condition }) };
    if (type !== 'if') {
      stack.pop(); // Pop for elif/else
    }
    getCurrentLevel().push(node);
    stack.push(node.children);
  };

  for (const token of tokens) {
    if (token.type === 'block') {
      const blockContent = token.value.slice(2, -2).trim();
      if (blockContent.startsWith('if')) {
        addConditionalNode('if', blockContent.slice(3).trim());
      } else if (blockContent.startsWith('elif')) {
        addConditionalNode('elif', blockContent.slice(5).trim());
      } else if (blockContent.startsWith('else')) {
        addConditionalNode('else');
      } else if (blockContent.startsWith('endif')) {
        stack.pop();
      }
    } else if (token.type === 'variable') {
      getCurrentLevel().push({ type: 'variable', value: token.value.slice(2, -2).trim() });
    } else if (token.type === 'text') {
      getCurrentLevel().push({ type: 'text', value: token.value });
    }
  }

  return children;
};

// Helper to handle decision nodes (both legacy and new)
const handleDecisionNode = (mermaidDiagram, nodeId, decisionData, isLegacy = false) => {
  let diagram = mermaidDiagram;
  const sourceId = isLegacy ? `${nodeId}_decision` : nodeId;

  // Add decision node for legacy format
  if (isLegacy) {
    diagram += `  ${sourceId}{"Decision"}\n`;
    diagram += addMermaidLine(nodeId, sourceId);
  }

  // Add connections to destination nodes
  const { nodes: destNodes, default_output } = decisionData;
  destNodes?.forEach(destNode => {
    const destNodeId = sanitizeId(destNode);
    diagram += addMermaidLine(sourceId, destNodeId);
  });

  // Add default output connection
  if (default_output) {
    const defaultOutputId = sanitizeId(default_output);
    diagram += addMermaidLine(sourceId, defaultOutputId);
  }

  return diagram;
};

// Helper to handle decision nodes (both legacy and new)
const handleRouterNode = (mermaidDiagram, nodeId, routerData) => {
  let diagram = mermaidDiagram;
  const sourceId = nodeId;

  // Add connections to destination nodes
  const { routes, default_output } = routerData;
  routes?.forEach(destNode => {
    const destNodeId = sanitizeId(destNode);
    diagram += addMermaidLine(sourceId, destNodeId);
  });

  // Add default output connection
  if (default_output) {
    const defaultOutputId = sanitizeId(default_output);
    diagram += addMermaidLine(sourceId, defaultOutputId);
  }

  return diagram;
};

export const parseYamlToMermaid = yamlString => {
  let yamlJson = {};
  let mermaidDiagram = 'graph TD\n';
  try {
    yamlJson = YAML.load(yamlString);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('render pipeline diagram, parse yaml error: ', error);
    return '';
  }
  if (!yamlJson) {
    return mermaidDiagram;
  }

  const nodes = yamlJson.nodes;
  const entryPoint = sanitizeId(yamlJson.entry_point);

  // Add start node and entry point connection
  if (entryPoint) {
    mermaidDiagram += `  start((Start))\n`;
    mermaidDiagram += addMermaidLine('start', entryPoint);
  }

  nodes?.forEach(node => {
    const nodeId = sanitizeId(node.id);

    // Add node to the diagram
    mermaidDiagram += `  ${nodeId}["${node.id}"]\n`;

    // Handle transitions
    if (node.transition) {
      const transitionId = sanitizeId(node.transition);
      mermaidDiagram += addMermaidLine(nodeId, transitionId);
    }

    // Handle conditions
    if (
      node.condition &&
      node.condition.condition_definition &&
      node.type !== FlowEditorConstants.PipelineNodeTypes.Router
    ) {
      const conditionId = `${nodeId}_condition`;
      mermaidDiagram += `  ${conditionId}{"Condition"}\n`;
      mermaidDiagram += addMermaidLine(nodeId, conditionId);
      mermaidDiagram += parseJinjaCondition(node.condition.condition_definition, conditionId);
    }

    // Handle decisions (legacy format with node.decision property)
    if (node.decision) {
      mermaidDiagram = handleDecisionNode(mermaidDiagram, nodeId, node.decision, true);
    }
    // Handle new decision node format (type-based)
    else if (node.type === FlowEditorConstants.PipelineNodeTypes.Decision) {
      mermaidDiagram = handleDecisionNode(mermaidDiagram, nodeId, node, false);
    }
    // Handle new decision node format (type-based)
    else if (node.type === FlowEditorConstants.PipelineNodeTypes.Router) {
      mermaidDiagram = handleRouterNode(mermaidDiagram, nodeId, node);
    }

    // Handle HITL nodes - routes is an object with action: target pairs
    if (node.type === FlowEditorConstants.PipelineNodeTypes.Hitl && node.routes) {
      Object.entries(node.routes).forEach(([action, target]) => {
        if (target) {
          const targetId = sanitizeId(target);
          mermaidDiagram += addMermaidLine(nodeId, targetId, action);
        }
      });
    }
  });

  return mermaidDiagram;
};
