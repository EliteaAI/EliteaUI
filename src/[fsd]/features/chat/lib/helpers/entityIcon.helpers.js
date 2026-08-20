import ContextIcon from '@/assets/context.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import McpIcon from '@/assets/mcp-icon.svg?react';
import SkillsIcon from '@/assets/skill-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';

const ENTITY_ICONS = {
  agent: ApplicationsIcon,
  pipeline: FlowIcon,
  skill: SkillsIcon,
  toolkit: ToolIcon,
  project_context: ContextIcon,
};

/**
 * Returns the icon component for a generated entity.
 * For toolkit entities, returns McpIcon when is_mcp is true.
 */
export const getEntityIcon = ({ entity_type, is_mcp }) => {
  if (entity_type === 'toolkit' && is_mcp) return McpIcon;
  return ENTITY_ICONS[entity_type];
};

/**
 * Returns the correct style prop for an icon component.
 * MUI icons (identified by muiName) accept sx; plain SVG ?react imports accept style only.
 */
export const getIconStyleProps = (Icon, stylesObj) =>
  Icon?.muiName ? { sx: stylesObj } : { style: stylesObj };
