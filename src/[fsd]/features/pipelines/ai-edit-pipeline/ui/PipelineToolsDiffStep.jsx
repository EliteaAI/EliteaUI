import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { matchDependencies } from '@/[fsd]/entities/compare-versions';
import { EditEntityComparisonLayout, ToolItemCard } from '@/[fsd]/entities/edit-entity-with-ai';
import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

import { getAddId, getRemoveId, normaliseCurrentTools, normaliseSuggestedTools } from '../lib/helpers';

const PipelineToolsDiffStep = memo(props => {
  const {
    currentTools,
    draftData,
    addToolkitIds,
    onToggleAddToolkit,
    addMcpIds,
    onToggleAddMcp,
    addAgentIds,
    onToggleAddAgent,
    addPipelineIds,
    onToggleAddPipeline,
    addSkillIds,
    onToggleAddSkill,
    removeToolRecordIds,
    onToggleRemoveTool,
  } = props;

  const styles = pipelineToolsDiffStepStyles();

  const leftTools = useMemo(() => normaliseCurrentTools(currentTools), [currentTools]);
  const rightTools = useMemo(() => normaliseSuggestedTools(draftData), [draftData]);

  const matchedRows = useMemo(() => matchDependencies(leftTools, rightTools), [leftTools, rightTools]);

  const noDiff = useMemo(
    () => matchedRows.length > 0 && matchedRows.every(row => row.left && row.right),
    [matchedRows],
  );

  const isAddChecked = item => {
    if (!item) return false;
    if (item.entityType === 'agent') return addAgentIds.has(item.id);
    if (item.entityType === 'pipeline') return addPipelineIds.has(item.id);
    if (item.entityType === 'mcp') return addMcpIds.has(item.id);
    if (item.entityType === 'skill') return (addSkillIds ?? new Set()).has(item.id);
    return addToolkitIds.has(item.id);
  };

  const handleToggleAdd = item => {
    if (!item) return;
    if (item.entityType === 'agent') return onToggleAddAgent(getAddId(item));
    if (item.entityType === 'pipeline') return onToggleAddPipeline(getAddId(item));
    if (item.entityType === 'mcp') return onToggleAddMcp(getAddId(item));
    if (item.entityType === 'skill') return onToggleAddSkill?.(getAddId(item));
    return onToggleAddToolkit(getAddId(item));
  };

  if (matchedRows.length === 0) return null;

  return (
    <EditEntityComparisonLayout
      currentContent={
        <Box sx={styles.column}>
          {noDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
          {matchedRows.map(row =>
            row.left ? (
              <Box
                key={row.key}
                sx={[styles.rowSlot, !row.right && styles.removeSlot]}
              >
                <Box sx={styles.removeRow}>
                  {!row.right && (
                    <BaseCheckbox
                      size="small"
                      checked={removeToolRecordIds.has(getRemoveId(row.left))}
                      onChange={() => onToggleRemoveTool(getRemoveId(row.left))}
                      sx={styles.checkbox}
                    />
                  )}
                  <ToolItemCard
                    item={row.left}
                    entityType={row.left.entityType}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                key={row.key}
                sx={styles.emptySlot}
              />
            ),
          )}
        </Box>
      }
      suggestedContent={
        <Box sx={styles.column}>
          {noDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
          {matchedRows.map(row =>
            row.right ? (
              <Box
                key={row.key}
                sx={[styles.rowSlot, !row.left && styles.addSlot]}
              >
                <Box sx={styles.addRow}>
                  {!row.left && (
                    <BaseCheckbox
                      size="small"
                      checked={isAddChecked(row.right)}
                      onChange={() => handleToggleAdd(row.right)}
                      sx={styles.checkbox}
                    />
                  )}
                  <ToolItemCard
                    item={row.right}
                    entityType={row.right.entityType}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                key={row.key}
                sx={styles.emptySlot}
              />
            ),
          )}
          {matchedRows.length === 0 && <Typography sx={styles.emptyText}>No tools suggested</Typography>}
        </Box>
      }
    />
  );
});

PipelineToolsDiffStep.displayName = 'PipelineToolsDiffStep';

/** @type {MuiSx} */
const pipelineToolsDiffStepStyles = () => ({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.5rem 2rem',
  },
  rowSlot: {
    minHeight: '3.75rem',
  },
  removeSlot: ({ palette }) => ({
    borderRadius: '0.5rem',
    backgroundColor: `${palette.error.main}18`,
    padding: '0.25rem',
  }),
  addSlot: ({ palette }) => ({
    borderRadius: '0.5rem',
    backgroundColor: palette.diff.added,
    padding: '0.25rem',
  }),
  emptySlot: ({ palette }) => ({
    minHeight: '3.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem dashed ${palette.border.lines}`,
  }),
  removeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  addRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
  noDiffNote: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
    marginBottom: '0.5rem',
  },
});

export default PipelineToolsDiffStep;
