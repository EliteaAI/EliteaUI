import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';

const PipelineYamlDiffStep = memo(props => {
  const { originalYaml = '', proposedYaml = '' } = props;

  const noDiff = originalYaml === proposedYaml;
  const styles = pipelineYamlDiffStepStyles();

  return (
    <EditEntityComparisonLayout
      currentLabel={<Typography sx={styles.columnLabel}>Current</Typography>}
      suggestedLabel={<Typography sx={styles.columnLabel}>Proposed</Typography>}
      currentContent={
        <Box sx={styles.codeCard}>
          {noDiff && <Typography sx={styles.noDiff}>No differences.</Typography>}
          <TextDiffHighlight
            original={proposedYaml}
            modified={originalYaml}
            mode="modified"
            editable={false}
          />
        </Box>
      }
      suggestedContent={
        <Box sx={styles.codeCard}>
          {noDiff && <Typography sx={styles.noDiff}>No differences.</Typography>}
          <TextDiffHighlight
            original={originalYaml}
            modified={proposedYaml}
            mode="modified"
            editable={false}
          />
        </Box>
      }
    />
  );
});

PipelineYamlDiffStep.displayName = 'PipelineYamlDiffStep';

/** @type {MuiSx} */
const pipelineYamlDiffStepStyles = () => ({
  columnLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
  },
  codeCard: ({ palette }) => ({
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
  }),
  noDiff: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
});

export default PipelineYamlDiffStep;
