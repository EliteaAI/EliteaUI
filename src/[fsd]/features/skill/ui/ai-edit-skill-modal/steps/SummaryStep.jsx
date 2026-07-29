import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { SKILL_NAME_MAX_LENGTH } from '@/[fsd]/features/skill/lib/constants';
import { Input, Text } from '@/[fsd]/shared/ui';
import { MAX_DESCRIPTION_LENGTH, MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';

const SummaryStep = memo(props => {
  const { currentData, draftData, onDraftChange, fieldApplyFlags, onToggleField } = props;

  const { mergedName, mergedDescription, mergedInstructions } = useMemo(
    () => ({
      mergedName: fieldApplyFlags.name ? draftData.name || '' : currentData.name || '',
      mergedDescription: fieldApplyFlags.description
        ? draftData.description || ''
        : currentData.description || '',
      mergedInstructions: fieldApplyFlags.instructions
        ? draftData.instructions || ''
        : currentData.version_details?.instructions || '',
    }),
    [currentData, draftData, fieldApplyFlags],
  );

  const handleFieldChange = useCallback(
    (field, value) => {
      if (!fieldApplyFlags[field]) onToggleField(field);
      onDraftChange({ ...draftData, [field]: value });
    },
    [draftData, fieldApplyFlags, onDraftChange, onToggleField],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Typography sx={styles.label}>Name</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            value={mergedName}
            onChange={e => handleFieldChange('name', e.target.value)}
            inputProps={{ maxLength: SKILL_NAME_MAX_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        <Text.CharacterCounter
          value={mergedName}
          maxLength={SKILL_NAME_MAX_LENGTH}
          hideMaxLimitMessage
          sx={styles.characterCounter}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Description</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={mergedDescription}
            onChange={e => handleFieldChange('description', e.target.value)}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        <Text.CharacterCounter
          value={mergedDescription}
          maxLength={MAX_DESCRIPTION_LENGTH}
          hideMaxLimitMessage
          sx={styles.characterCounter}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Instructions</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            multiline
            minRows={4}
            maxRows={10}
            value={mergedInstructions}
            onChange={e => handleFieldChange('instructions', e.target.value)}
            inputProps={{ maxLength: MAX_INSTRUCTIONS_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        <Text.CharacterCounter
          value={mergedInstructions}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
          hideMaxLimitMessage
          sx={styles.characterCounter}
        />
      </Box>
    </Box>
  );
});

SummaryStep.displayName = 'SkillEditSummaryStep';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 2rem 1.25rem',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    maxWidth: '50rem',
    width: '100%',
    margin: '0 auto',
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
  editableCard: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  cardInput: ({ palette }) => ({
    '& .MuiInputBase-input': {
      padding: '0 !important',
      margin: '0 !important',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5rem',
      color: palette.text.secondary,
    },
    '& .MuiInputBase-root': {
      padding: '0 !important',
      minHeight: 'unset',
      '&::before, &::after': {
        display: 'none !important',
      },
    },
    '& .MuiInput-underline::before, & .MuiInput-underline::after': {
      display: 'none !important',
    },
    '& textarea': {
      padding: '0 !important',
      margin: '0 !important',
    },
    padding: 0,
  }),
  characterCounter: {
    alignSelf: 'flex-end',
  },
};

export default SummaryStep;
