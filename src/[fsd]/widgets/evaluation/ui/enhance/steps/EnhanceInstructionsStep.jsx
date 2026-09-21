import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';

import EnhanceFixRow, { FIX_ROW_MODE } from '../EnhanceFixRow';

const CONFLICT_MESSAGE =
  'This update no longer matches the current instructions and cannot be applied. Uncheck it to continue.';

/** Several updates are numbered so a conflict message can be traced back to a row; one is not. */
const resolveFixTitle = (fix, index, total) => {
  if (fix.replace_all) return 'Full instructions rewrite';

  return total > 1 ? `Instructions update ${index + 1}` : 'Instructions update';
};

const EnhanceInstructionsStep = memo(props => {
  const {
    currentInstructions = '',
    proposedInstructions = '',
    isLoadingInstructions = false,
    agentFixes = [],
    acceptedFlags = [],
    onToggle,
    conflictIndex = -1,
  } = props;

  const styles = enhanceInstructionsStepStyles();

  if (isLoadingInstructions) {
    return (
      <Box
        sx={styles.loading}
        data-testid="enhance-instructions-loading"
      >
        <CircularProgress size={24} />
        <Typography
          variant="bodyMedium"
          sx={styles.loadingText}
        >
          Loading current instructions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="enhance-instructions-step"
    >
      <EditEntityComparisonLayout
        currentContent={
          <Box sx={styles.fieldSection}>
            <Typography sx={styles.fieldLabel}>Instructions</Typography>
            <Box sx={styles.card}>
              {currentInstructions ? (
                <TextDiffHighlight
                  original={currentInstructions}
                  modified={proposedInstructions}
                  mode="original"
                />
              ) : (
                <Typography sx={styles.emptyText}>No instructions</Typography>
              )}
            </Box>
          </Box>
        }
        suggestedContent={
          <Box sx={styles.fieldSection}>
            <Typography sx={styles.fieldLabel}>Instructions</Typography>
            <Box sx={styles.card}>
              <TextDiffHighlight
                original={currentInstructions}
                modified={proposedInstructions}
                mode="modified"
              />
            </Box>
          </Box>
        }
      />

      <Box sx={styles.editsPanel}>
        <Typography sx={styles.sectionLabel}>Agent updates</Typography>
        <Box sx={styles.editsList}>
          {agentFixes.map((fix, index) => (
            <EnhanceFixRow
              key={`agent-fix-${index}`}
              testId={`enhance-agent-fix-${index}`}
              mode={FIX_ROW_MODE.checkbox}
              checked={Boolean(acceptedFlags[index])}
              onToggle={() => onToggle?.(index)}
              title={resolveFixTitle(fix, index, agentFixes.length)}
              rationale={fix.rationale}
              statusMessage={conflictIndex === index ? CONFLICT_MESSAGE : undefined}
              status={conflictIndex === index ? 'error' : undefined}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
});

EnhanceInstructionsStep.displayName = 'EnhanceInstructionsStep';

/** @type {MuiSx} */
const enhanceInstructionsStepStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    flex: 1,
  },
  loadingText: ({ palette }) => ({
    color: palette.text.primary,
  }),
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
    flex: 1,
    minHeight: 0,
  },
  fieldLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  card: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  }),
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
  },
  editsPanel: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flexShrink: 0,
    maxHeight: '40%',
    overflowY: 'auto',
    padding: '1rem 2rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  editsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});

export default EnhanceInstructionsStep;
