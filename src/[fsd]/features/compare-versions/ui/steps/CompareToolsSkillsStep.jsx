import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout } from '@/[fsd]/entities/edit-entity-with-ai';
import ToolItemCard from '@/[fsd]/features/agent/ui/ai-edit-agent-modal/steps/ToolItemCard';

import { matchDependencies } from '../../lib/helpers/compareVersions.helpers';
import CompareVersionHeader from '../CompareVersionHeader';

const CompareToolsSkillsStep = memo(props => {
  const { leftVersion, rightVersion, leftData, rightData } = props;

  const matchedRows = useMemo(
    () =>
      matchDependencies(
        leftData.tools ?? [],
        leftData.skills ?? [],
        rightData.tools ?? [],
        rightData.skills ?? [],
      ),
    [leftData, rightData],
  );

  const noDiff = useMemo(
    () => matchedRows.length > 0 && matchedRows.every(row => row.left && row.right),
    [matchedRows],
  );

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <Box sx={styles.column}>
          {noDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
          {matchedRows.map((row, i) =>
            row.left ? (
              <Box
                key={i}
                sx={row.right ? styles.cardWrapper : styles.uniqueCard}
              >
                <ToolItemCard
                  item={row.left}
                  entityType={row.left.entityType}
                />
              </Box>
            ) : (
              <Box
                key={i}
                sx={styles.emptySlot}
              />
            ),
          )}
          {matchedRows.length === 0 && (
            <Typography sx={styles.emptyText}>No tools, agents, pipelines or skills attached</Typography>
          )}
        </Box>
      }
      suggestedContent={
        <Box sx={styles.column}>
          {noDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
          {matchedRows.map((row, i) =>
            row.right ? (
              <Box
                key={i}
                sx={row.left ? styles.cardWrapper : styles.uniqueCard}
              >
                <ToolItemCard
                  item={row.right}
                  entityType={row.right.entityType}
                />
              </Box>
            ) : (
              <Box
                key={i}
                sx={styles.emptySlot}
              />
            ),
          )}
          {matchedRows.length === 0 && (
            <Typography sx={styles.emptyText}>No tools, agents, pipelines or skills attached</Typography>
          )}
        </Box>
      }
    />
  );
});

CompareToolsSkillsStep.displayName = 'CompareToolsSkillsStep';

/** @type {MuiSx} */
const styles = {
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.5rem 2rem',
  },
  cardWrapper: {
    minHeight: '3.5rem',
  },
  uniqueCard: ({ palette }) => ({
    minHeight: '3.5rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.diff.added,
    padding: '0.25rem',
  }),
  emptySlot: ({ palette }) => ({
    minHeight: '3.5rem',
    borderRadius: '0.5rem',
    border: `0.0625rem dashed ${palette.border.lines}`,
  }),
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
};

export default CompareToolsSkillsStep;
