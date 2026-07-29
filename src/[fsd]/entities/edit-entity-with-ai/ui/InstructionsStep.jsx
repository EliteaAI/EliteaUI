import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Text } from '@/[fsd]/shared/ui';
import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

import EditEntityComparisonLayout from './EditEntityComparisonLayout';
import TextDiffHighlight from './TextDiffHighlight';

const InstructionsStep = memo(props => {
  const { currentData, draftData, onDraftChange, fieldApplyFlags, onToggleField, maxLength } = props;

  const currentInstructions = currentData.version_details?.instructions || '';
  const suggestedInstructions = draftData.instructions || '';

  const handleChange = useCallback(
    newText => {
      onDraftChange({ ...draftData, instructions: newText });
    },
    [draftData, onDraftChange],
  );

  return (
    <EditEntityComparisonLayout
      currentContent={
        <Box sx={styles.fieldSection}>
          <Typography sx={styles.fieldLabel}>Instructions</Typography>
          <Box sx={styles.readOnlyCard}>
            {currentInstructions ? (
              <TextDiffHighlight
                original={currentInstructions}
                modified={suggestedInstructions}
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
          <Box sx={styles.fieldHeader}>
            <Typography sx={styles.fieldLabel}>Instructions</Typography>
            <Box sx={styles.applyToggle}>
              <Typography sx={styles.applyLabel}>Apply changes</Typography>
              <BaseCheckbox
                size="small"
                checked={fieldApplyFlags.instructions}
                onChange={() => onToggleField('instructions')}
                sx={styles.checkbox}
              />
            </Box>
          </Box>
          <Box sx={styles.editableCard}>
            <TextDiffHighlight
              original={currentInstructions}
              modified={suggestedInstructions}
              mode="modified"
              editable
              onChange={handleChange}
              maxLength={maxLength}
            />
          </Box>
          {maxLength ? (
            <Text.CharacterCounter
              value={suggestedInstructions}
              maxLength={maxLength}
              hideMaxLimitMessage
              sx={styles.characterCounter}
            />
          ) : null}
        </Box>
      }
    />
  );
});

InstructionsStep.displayName = 'EditEntityInstructionsStep';

/** @type {MuiSx} */
const styles = {
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
  applyToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  applyLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'text.secondary',
  },
  checkbox: {
    padding: '0.25rem',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
  },
  readOnlyCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  }),
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  characterCounter: {
    alignSelf: 'flex-end',
  },
};

export default InstructionsStep;
