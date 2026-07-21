import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import { getToolIconByType } from '@/common/toolkitUtils';
import EntityIcon from '@/components/EntityIcon';

const ToolItem = memo(props => {
  const { item, checked, onToggle, entityType } = props;
  const theme = useTheme();

  const icon =
    entityType === 'toolkit' && item.type ? { component: getToolIconByType(item.type, theme) } : null;

  const secondaryText = entityType === 'toolkit' ? item.type : item.description;
  const showSecondary = secondaryText && secondaryText !== item.name;
  const resolvedEntityType = entityType === 'toolkit' ? undefined : entityType;

  return (
    <Box
      sx={styles.item}
      onClick={() => onToggle(item.id)}
    >
      <BaseCheckbox
        size="small"
        checked={checked}
        onChange={() => onToggle(item.id)}
        onClick={e => e.stopPropagation()}
        sx={styles.checkbox}
      />
      <Box sx={styles.card}>
        <EntityIcon
          icon={icon}
          entityType={resolvedEntityType}
          specifiedFontSize="1rem"
        />
        <Box sx={styles.cardContent}>
          <Typography
            sx={styles.itemName}
            noWrap
          >
            {item.name}
          </Typography>
          {showSecondary && (
            <Typography
              sx={styles.secondaryText}
              noWrap
            >
              {secondaryText}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
});

ToolItem.displayName = 'ToolItem';

const ToolSection = memo(props => {
  const { title, items, selectedIds, onToggle, entityType } = props;

  if (!items?.length) return null;

  return (
    <Box sx={styles.section}>
      <Typography sx={styles.sectionLabel}>{title}</Typography>
      <Box sx={styles.list}>
        {items.map(item => (
          <ToolItem
            key={item.id}
            item={item}
            checked={selectedIds.has(item.id)}
            onToggle={onToggle}
            entityType={entityType}
          />
        ))}
      </Box>
    </Box>
  );
});

ToolSection.displayName = 'ToolSection';

const ToolsSkillsStep = memo(props => {
  const { draftData, toolSelections, onToggleTool } = props;

  const suggestedToolkits = draftData.suggested_toolkits || [];
  const suggestedMcp = draftData.suggested_mcp || [];
  const suggestedAgents = draftData.suggested_agents || [];
  const suggestedPipelines = draftData.suggested_pipelines || [];
  const suggestedSkills = draftData.suggested_skills || [];
  const toolsToRemove = draftData.tools_to_remove || [];
  const skillsToRemove = draftData.skills_to_remove || [];

  const hasAdditions =
    suggestedToolkits.length > 0 ||
    suggestedMcp.length > 0 ||
    suggestedAgents.length > 0 ||
    suggestedPipelines.length > 0 ||
    suggestedSkills.length > 0;

  const hasRemovals = toolsToRemove.length > 0 || skillsToRemove.length > 0;

  return (
    <Box sx={styles.container}>
      {hasRemovals && (
        <Box sx={styles.group}>
          <Typography sx={styles.groupTitle}>Suggested to Remove</Typography>
          <ToolSection
            title="Toolkits"
            items={toolsToRemove.filter(t => t.entity_type === 'toolkit')}
            selectedIds={toolSelections.toRemove}
            onToggle={id => onToggleTool('toRemove', id)}
            entityType="toolkit"
          />
          <ToolSection
            title="Skills"
            items={skillsToRemove}
            selectedIds={toolSelections.toRemove}
            onToggle={id => onToggleTool('toRemove', id)}
            entityType="skill"
          />
        </Box>
      )}

      {hasAdditions && (
        <Box sx={styles.group}>
          <Typography sx={styles.groupTitle}>Suggested to Add</Typography>
          <ToolSection
            title="Toolkits"
            items={suggestedToolkits}
            selectedIds={toolSelections.toAdd}
            onToggle={id => onToggleTool('toAdd', id)}
            entityType="toolkit"
          />
          <ToolSection
            title="MCP"
            items={suggestedMcp}
            selectedIds={toolSelections.toAdd}
            onToggle={id => onToggleTool('toAdd', id)}
            entityType="mcp"
          />
          <ToolSection
            title="Agents"
            items={suggestedAgents}
            selectedIds={toolSelections.toAdd}
            onToggle={id => onToggleTool('toAdd', id)}
            entityType="agent"
          />
          <ToolSection
            title="Pipelines"
            items={suggestedPipelines}
            selectedIds={toolSelections.toAdd}
            onToggle={id => onToggleTool('toAdd', id)}
            entityType="pipeline"
          />
          <ToolSection
            title="Skills"
            items={suggestedSkills}
            selectedIds={toolSelections.toAdd}
            onToggle={id => onToggleTool('toAdd', id)}
            entityType="skill"
          />
        </Box>
      )}
    </Box>
  );
});

ToolsSkillsStep.displayName = 'ToolsSkillsStep';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    padding: '1rem 2rem 1.25rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  groupTitle: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
  },
  checkbox: {
    padding: '0.25rem',
    flexShrink: 0,
  },
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    minWidth: 0,
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    flex: 1,
  },
  itemName: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: 'text.secondary',
  },
  secondaryText: {
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    color: 'text.primary',
  },
};

export default ToolsSkillsStep;
