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
  const nodeColors = theme?.palette?.components?.flowEditor?.nodeColors;

  return nodeColors?.[nodeType] || nodeColors?.custom || theme?.palette?.icon?.secondary;
};

export const isDeprecatedNodeType = type => {
  return DeprecatedConstants.DeprecatedNodes.includes(type);
};

export const getNodeIconByType = (type, theme, specifiedColor) => {
  const iconColor = specifiedColor || theme.palette.icon.secondary;
  // SVGR icons don't support sx, so the size/color go through a shared style object.
  const iconStyle = { fontSize: '1rem', color: iconColor };

  switch (type) {
    case FlowEditorConstants.PipelineNodeTypes.Mcp:
      return (
        <MCPIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.LLM:
      return (
        <ModelIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Toolkit:
    case FlowEditorConstants.PipelineNodeTypes.Tool:
      return (
        <ToolIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Function:
      return (
        <FunctionIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Condition:
      return (
        <ConditionIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Decision:
      return (
        <DecisionIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.LoopFromTool:
      return (
        <RepeatIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Loop:
      return (
        <RepeatOneIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Agent:
      return (
        <AgentIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Pipeline:
      return (
        <FlowIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Router:
      return (
        <RouterIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.StateModifier:
      return (
        <StateModifierIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Code:
      return (
        <CodeIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Printer:
      return (
        <PrinterIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Hitl:
      return (
        <HumanIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.Custom:
      return (
        <JsonIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    case FlowEditorConstants.PipelineNodeTypes.End:
      return (
        <FlagIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
    default:
      return (
        <JsonIcon
          style={iconStyle}
          fill={iconColor}
        />
      );
  }
};
