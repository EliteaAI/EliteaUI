import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';

import {
  DeprecatedConstants,
  FlowEditorConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import AgentIcon from '@/assets/agent.svg?react';
import CodeIcon from '@/assets/code-icon.svg?react';
import ConditionIcon from '@/assets/condition-icon.svg?react';
import DecisionIcon from '@/assets/decision-icon.svg?react';
import FlagIcon from '@/assets/flag-icon.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import HumanIcon from '@/assets/human/human-icon.svg?react';
import JsonIcon from '@/assets/json-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import ModelIcon from '@/assets/model-icon.svg?react';
import PrinterIcon from '@/assets/printer.svg?react';
import RouterIcon from '@/assets/router.svg?react';
import StateModifierIcon from '@/assets/state_modifier.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import FunctionIcon from '@/assets/vector-icon.svg?react';

export const getNodeColor = (nodeType, theme) => {
  const nodeColors = theme?.palette?.nodeColors;

  return nodeColors?.[nodeType] || nodeColors?.custom || '#666666';
};

export const isDeprecatedNodeType = type => {
  return DeprecatedConstants.DeprecatedNodes.includes(type);
};

export const getNodeIconByType = (type, theme, specifiedColor) => {
  const iconColor = specifiedColor || theme.palette.text.secondary;

  switch (type) {
    case FlowEditorConstants.PipelineNodeTypes.Mcp:
      return (
        <MCPIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.LLM:
      return (
        <ModelIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Toolkit:
    case FlowEditorConstants.PipelineNodeTypes.Tool:
      return (
        <ToolIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Function:
      return (
        <FunctionIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Condition:
      return (
        <ConditionIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Decision:
      return (
        <DecisionIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.LoopFromTool:
      return (
        <RepeatIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Loop:
      return (
        <RepeatOneIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Agent:
      return (
        <AgentIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Pipeline:
      return (
        <FlowIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Router:
      return (
        <RouterIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.StateModifier:
      return (
        <StateModifierIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Code:
      return (
        <CodeIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Printer:
      return (
        <PrinterIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Hitl:
      return (
        <HumanIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Custom:
      return (
        <JsonIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.End:
      return (
        <FlagIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
    default:
      return (
        <JsonIcon
          style={{ fontSize: '1rem', color: iconColor }}
          fill={iconColor}
        />
      );
  }
};
