import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Input } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';
import {
  MAX_CONVERSATION_STARTERS,
  MAX_CONVERSATION_STARTER_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_WELCOME_MESSAGE_LENGTH,
} from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';

const SummaryStep = memo(props => {
  const { currentData, draftData, onDraftChange, fieldApplyFlags } = props;

  const { mergedName, mergedDescription, mergedInstructions, mergedWelcome, mergedStarters } = useMemo(
    () => ({
      mergedName: fieldApplyFlags.name ? draftData.name || '' : currentData.name || '',
      mergedDescription: fieldApplyFlags.description
        ? draftData.description || ''
        : currentData.description || '',
      mergedInstructions: fieldApplyFlags.instructions
        ? draftData.instructions || ''
        : currentData.version_details?.instructions || '',
      mergedWelcome: fieldApplyFlags.welcome_message
        ? draftData.welcome_message || ''
        : currentData.version_details?.welcome_message || '',
      mergedStarters: fieldApplyFlags.conversation_starters
        ? draftData.conversation_starters || []
        : currentData.version_details?.conversation_starters || [],
    }),
    [currentData, draftData, fieldApplyFlags],
  );

  const handleFieldChange = useCallback(
    (field, value) => {
      onDraftChange({ ...draftData, [field]: value });
    },
    [draftData, onDraftChange],
  );

  const handleStarterChange = useCallback(
    (index, value) => {
      const updated = [...mergedStarters];
      updated[index] = value;
      onDraftChange({ ...draftData, conversation_starters: updated });
    },
    [draftData, mergedStarters, onDraftChange],
  );

  const handleRemoveStarter = useCallback(
    index => {
      const updated = mergedStarters.filter((_, i) => i !== index);
      onDraftChange({ ...draftData, conversation_starters: updated });
    },
    [draftData, mergedStarters, onDraftChange],
  );

  const handleAddStarter = useCallback(() => {
    const updated = [...mergedStarters, ''];
    onDraftChange({ ...draftData, conversation_starters: updated });
  }, [draftData, mergedStarters, onDraftChange]);

  const disableAddStarter = useMemo(
    () => mergedStarters.length >= MAX_CONVERSATION_STARTERS || mergedStarters.some(s => !s?.trim()),
    [mergedStarters],
  );

  const addStarterTooltip = useMemo(() => {
    if (mergedStarters.length >= MAX_CONVERSATION_STARTERS)
      return 'You have reached the limit of conversation starters';
    return '';
  }, [mergedStarters]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Typography sx={styles.label}>Name</Typography>
        <Input.InputBase
          fullWidth
          value={mergedName}
          onChange={e => handleFieldChange('name', e.target.value)}
          disabled={!fieldApplyFlags.name}
          inputProps={{ maxLength: MAX_NAME_LENGTH }}
          enableAutoBlur={false}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Description</Typography>
        <Input.InputBase
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={mergedDescription}
          onChange={e => handleFieldChange('description', e.target.value)}
          disabled={!fieldApplyFlags.description}
          inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
          enableAutoBlur={false}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Instructions</Typography>
        <Input.InputBase
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
          value={mergedInstructions}
          onChange={e => handleFieldChange('instructions', e.target.value)}
          disabled={!fieldApplyFlags.instructions}
          enableAutoBlur={false}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Welcome Message</Typography>
        <Input.InputBase
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={mergedWelcome}
          onChange={e => handleFieldChange('welcome_message', e.target.value)}
          disabled={!fieldApplyFlags.welcome_message}
          inputProps={{ maxLength: MAX_WELCOME_MESSAGE_LENGTH }}
          enableAutoBlur={false}
        />
      </Box>

      {mergedStarters.length > 0 && (
        <Box sx={styles.section}>
          <Typography sx={styles.sectionLabel}>Conversation starters:</Typography>
          <Box sx={styles.startersList}>
            {mergedStarters.map((starter, index) => (
              <Box
                key={index}
                sx={styles.starterRow}
              >
                <Input.InputBase
                  fullWidth
                  value={starter}
                  onChange={e => handleStarterChange(index, e.target.value)}
                  disabled={!fieldApplyFlags.conversation_starters}
                  inputProps={{ maxLength: MAX_CONVERSATION_STARTER_LENGTH }}
                  enableAutoBlur={false}
                />
                {fieldApplyFlags.conversation_starters && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveStarter(index)}
                    sx={styles.removeBtn}
                  >
                    <CloseIcon sx={styles.removeIcon} />
                  </IconButton>
                )}
              </Box>
            ))}
            {fieldApplyFlags.conversation_starters && (
              <Box sx={styles.addStarterRow}>
                <Tooltip
                  placement="top-start"
                  title={addStarterTooltip}
                >
                  <Box sx={styles.addStarterWrapper}>
                    <BaseBtn
                      variant={BUTTON_VARIANTS.iconLabel}
                      size="small"
                      disabled={disableAddStarter}
                      onClick={handleAddStarter}
                      startIcon={<PlusIcon />}
                    >
                      Starter
                    </BaseBtn>
                  </Box>
                </Tooltip>
                <Typography sx={styles.addedCount}>
                  {mergedStarters.length}/{MAX_CONVERSATION_STARTERS} added.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
});

SummaryStep.displayName = 'SummaryStep';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 2rem 1.25rem',
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
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '0.5rem',
  },
  startersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  starterRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
  },
  removeBtn: ({ palette }) => ({
    backgroundColor: palette.background.userInputBackgroundActive,
    borderRadius: '1rem',
    padding: '0.375rem',
    marginTop: '0.25rem',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  }),
  removeIcon: {
    fontSize: '1rem',
  },
  addStarterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  addStarterWrapper: {
    display: 'inline-flex',
  },
  addedCount: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: 'text.primary',
  },
};

export default SummaryStep;
