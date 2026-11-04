import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';

import CompareVersionHeader from '../CompareVersionHeader';

const ComparePipelineYamlStep = memo(props => {
  const { leftVersion, rightVersion, leftData, rightData } = props;

  const leftYaml = leftData?.version_details?.instructions ?? '';
  const rightYaml = rightData?.version_details?.instructions ?? '';
  const noDiff = leftYaml === rightYaml;

  const styles = comparePipelineYamlStepStyles();

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <Box sx={styles.fieldSection}>
          <Box sx={styles.fieldHeader}>
            <Typography sx={styles.fieldLabel}>Pipeline YAML</Typography>
          </Box>
          {noDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
          <Box sx={styles.codeCard}>
            <TextDiffHighlight
              original={rightYaml}
              modified={leftYaml}
              mode="modified"
              editable={false}
            />
          </Box>
        </Box>
      }
      suggestedContent={
        <Box sx={styles.fieldSection}>
          <Box sx={styles.fieldHeader}>
            <Typography sx={styles.fieldLabel}>Pipeline YAML</Typography>
          </Box>
          {noDiff && <Typography sx={styles.noDiffNote}>No differences in this section.</Typography>}
          <Box sx={styles.codeCard}>
            <TextDiffHighlight
              original={leftYaml}
              modified={rightYaml}
              mode="modified"
              editable={false}
            />
          </Box>
        </Box>
      }
    />
  );
});

ComparePipelineYamlStep.displayName = 'ComparePipelineYamlStep';

/** @type {MuiSx} */
const comparePipelineYamlStepStyles = () => ({
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
    flex: 1,
    minHeight: 0,
  },
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  noDiffNote: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
  codeCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
  }),
});

export default ComparePipelineYamlStep;
