import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout } from '@/[fsd]/entities/edit-entity-with-ai';
import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

import ToolItemCard from './ToolItemCard';

const normalizeToolItem = (item, entityType) => ({
  ...item,
  entityType: item.entity_type || entityType,
});

const ToolsSkillsStep = memo(props => {
  const { currentTools = [], draftData, toolSelections, onToggleTool } = props;

  const removeItems = useMemo(
    () => [
      ...(draftData.tools_to_remove || []).map(item => normalizeToolItem(item, 'toolkit')),
      ...(draftData.skills_to_remove || []).map(item => normalizeToolItem(item, 'skill')),
    ],
    [draftData.tools_to_remove, draftData.skills_to_remove],
  );

  const addItems = useMemo(() => {
    const currentKeys = new Set(
      currentTools.map(t => {
        const type = t.type === 'application' ? 'agent' : t.type === 'skill' ? 'skill' : 'toolkit';
        return `${type}:${t.id}`;
      }),
    );
    return [
      ...(draftData.suggested_toolkits || []).map(item => normalizeToolItem(item, 'toolkit')),
      ...(draftData.suggested_mcp || []).map(item => normalizeToolItem(item, 'mcp')),
      ...(draftData.suggested_agents || []).map(item => normalizeToolItem(item, 'agent')),
      ...(draftData.suggested_pipelines || []).map(item => normalizeToolItem(item, 'pipeline')),
      ...(draftData.suggested_skills || []).map(item => normalizeToolItem(item, 'skill')),
    ].filter(item => !currentKeys.has(`${item.entityType}:${item.id}`));
  }, [
    currentTools,
    draftData.suggested_toolkits,
    draftData.suggested_mcp,
    draftData.suggested_agents,
    draftData.suggested_pipelines,
    draftData.suggested_skills,
  ]);

  const keepItems = useMemo(() => {
    if (!currentTools.length) return [];

    const removeKeys = new Set(removeItems.map(i => `${i.entityType}:${i.id}`));

    return currentTools
      .filter(t => {
        const type = t.type === 'application' ? 'agent' : t.type === 'skill' ? 'skill' : 'toolkit';
        return !removeKeys.has(`${type}:${t.id}`);
      })
      .map(item =>
        normalizeToolItem(
          item,
          item.type === 'application' ? 'agent' : item.type === 'skill' ? 'skill' : 'toolkit',
        ),
      );
  }, [currentTools, removeItems]);

  const currentItemsNormalized = useMemo(
    () =>
      currentTools.map(item =>
        normalizeToolItem(
          item,
          item.type === 'application' ? 'agent' : item.type === 'skill' ? 'skill' : 'toolkit',
        ),
      ),
    [currentTools],
  );

  return (
    <EditEntityComparisonLayout
      currentContent={
        <Box sx={styles.currentColumn}>
          <Box sx={styles.cardList}>
            {currentItemsNormalized.map(item => (
              <ToolItemCard
                key={item.id}
                item={item}
                entityType={item.entityType}
              />
            ))}
            {currentItemsNormalized.length === 0 && (
              <Typography sx={styles.emptyText}>No tools or skills attached</Typography>
            )}
          </Box>
        </Box>
      }
      suggestedContent={
        <Box sx={styles.suggestedColumn}>
          {removeItems.length > 0 && (
            <Box sx={styles.section}>
              <Typography sx={styles.sectionLabel}>Suggested to Remove:</Typography>
              <Box sx={styles.cardList}>
                {removeItems.map(item => {
                  const toolKey = `${item.entityType}:${item.id}`;
                  return (
                    <Box
                      key={toolKey}
                      sx={styles.checkboxRow}
                      onClick={() => onToggleTool('toRemove', toolKey)}
                    >
                      <BaseCheckbox
                        size="small"
                        checked={toolSelections.toRemove.has(toolKey)}
                        onChange={() => onToggleTool('toRemove', toolKey)}
                        onClick={e => e.stopPropagation()}
                        sx={styles.checkbox}
                      />
                      <ToolItemCard
                        item={item}
                        entityType={item.entityType}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
          {addItems.length > 0 && (
            <Box sx={styles.section}>
              <Typography sx={styles.sectionLabel}>Suggested to Add:</Typography>
              <Box sx={styles.cardList}>
                {addItems.map(item => {
                  const toolKey = `${item.entityType}:${item.id}`;
                  return (
                    <Box
                      key={toolKey}
                      sx={styles.checkboxRow}
                      onClick={() => onToggleTool('toAdd', toolKey)}
                    >
                      <BaseCheckbox
                        size="small"
                        checked={toolSelections.toAdd.has(toolKey)}
                        onChange={() => onToggleTool('toAdd', toolKey)}
                        onClick={e => e.stopPropagation()}
                        sx={styles.checkbox}
                      />
                      <ToolItemCard
                        item={item}
                        entityType={item.entityType}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
          {keepItems.length > 0 && (
            <Box sx={styles.section}>
              <Typography sx={styles.sectionLabel}>Suggested to Keep:</Typography>
              <Box sx={styles.cardList}>
                {keepItems.map(item => {
                  const toolKey = `${item.entityType}:${item.id}`;
                  return (
                    <Box
                      key={toolKey}
                      sx={styles.checkboxRow}
                      onClick={() => onToggleTool('toKeep', toolKey)}
                    >
                      <BaseCheckbox
                        size="small"
                        checked={toolSelections.toKeep?.has(toolKey) ?? true}
                        onChange={() => onToggleTool('toKeep', toolKey)}
                        onClick={e => e.stopPropagation()}
                        sx={styles.checkbox}
                      />
                      <ToolItemCard
                        item={item}
                        entityType={item.entityType}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      }
    />
  );
});

ToolsSkillsStep.displayName = 'ToolsSkillsStep';

/** @type {MuiSx} */
const styles = {
  currentColumn: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 2rem',
  },
  suggestedColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem 2rem 0',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
  },
  checkbox: {
    padding: '0.25rem',
    flexShrink: 0,
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
  },
};

export default ToolsSkillsStep;
