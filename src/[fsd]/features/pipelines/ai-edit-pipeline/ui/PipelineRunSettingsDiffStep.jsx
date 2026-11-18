import { memo } from 'react';

import { Box } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';

const PipelineRunSettingsDiffStep = memo(props => {
  const { currentName, currentDescription, proposedName, proposedDescription } = props;

  const styles = pipelineRunSettingsDiffStepStyles();

  return (
    <EditEntityComparisonLayout
      currentContent={
        <Box sx={styles.column}>
          <Box sx={styles.field}>
            <Box sx={styles.label}>Name</Box>
            <Box sx={styles.readCard}>
              <TextDiffHighlight
                original={currentName}
                modified={proposedName}
                mode="original"
              />
            </Box>
          </Box>
          <Box sx={styles.field}>
            <Box sx={styles.label}>Description</Box>
            <Box sx={styles.readCard}>
              {currentDescription ? (
                <TextDiffHighlight
                  original={currentDescription}
                  modified={proposedDescription}
                  mode="original"
                />
              ) : (
                <Box sx={styles.emptyText}>No description</Box>
              )}
            </Box>
          </Box>
        </Box>
      }
      suggestedContent={
        <Box sx={styles.column}>
          <Box sx={styles.field}>
            <Box sx={styles.label}>Name</Box>
            <Box sx={styles.readCard}>
              <TextDiffHighlight
                original={currentName}
                modified={proposedName}
                mode="modified"
              />
            </Box>
          </Box>
          <Box sx={styles.field}>
            <Box sx={styles.label}>Description</Box>
            <Box sx={styles.readCard}>
              {proposedDescription ? (
                <TextDiffHighlight
                  original={currentDescription}
                  modified={proposedDescription}
                  mode="modified"
                />
              ) : (
                <Box sx={styles.emptyText}>No description</Box>
              )}
            </Box>
          </Box>
        </Box>
      }
    />
  );
});

PipelineRunSettingsDiffStep.displayName = 'PipelineRunSettingsDiffStep';

/** @type {MuiSx} */
const pipelineRunSettingsDiffStepStyles = () => ({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem 2rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  readCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '2.5rem',
  }),
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
  },
});

export default PipelineRunSettingsDiffStep;
