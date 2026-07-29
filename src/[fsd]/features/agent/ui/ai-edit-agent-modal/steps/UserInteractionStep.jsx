import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import { Input, Text } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { MAX_CONVERSATION_STARTERS, MAX_CONVERSATION_STARTER_LENGTH } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';

const UserInteractionStep = memo(props => {
  const { currentData, draftData, onDraftChange, fieldApplyFlags, onToggleField } = props;

  const currentWelcome = currentData.version_details?.welcome_message || '';

  const currentStarters = useMemo(
    () => currentData.version_details?.conversation_starters || [],
    [currentData.version_details?.conversation_starters],
  );
  const suggestedWelcome = draftData.welcome_message || '';
  const suggestedStarters = useMemo(
    () => draftData.conversation_starters || [],
    [draftData.conversation_starters],
  );

  const handleWelcomeChange = useCallback(
    newText => {
      onDraftChange({ ...draftData, welcome_message: newText });
    },
    [draftData, onDraftChange],
  );

  const handleStarterChange = useCallback(
    (index, value) => {
      const updated = [...suggestedStarters];
      updated[index] = value;
      onDraftChange({ ...draftData, conversation_starters: updated });
    },
    [draftData, suggestedStarters, onDraftChange],
  );

  const handleRemoveStarter = useCallback(
    index => {
      const updated = suggestedStarters.filter((_, i) => i !== index);
      onDraftChange({ ...draftData, conversation_starters: updated });
    },
    [draftData, suggestedStarters, onDraftChange],
  );

  const handleAddStarter = useCallback(() => {
    const updated = [...suggestedStarters, ''];
    onDraftChange({ ...draftData, conversation_starters: updated });
  }, [draftData, suggestedStarters, onDraftChange]);

  const disableAddStarter = useMemo(
    () => suggestedStarters.length >= MAX_CONVERSATION_STARTERS || suggestedStarters.some(s => !s?.trim()),
    [suggestedStarters],
  );

  const addStarterTooltip = useMemo(() => {
    if (suggestedStarters.length >= MAX_CONVERSATION_STARTERS)
      return 'You have reached the limit of chat starters';
    return '';
  }, [suggestedStarters]);

  const filteredCurrentStarters = useMemo(() => currentStarters.filter(Boolean), [currentStarters]);

  const hasStarters = filteredCurrentStarters.length > 0 || suggestedStarters.length > 0;

  return (
    <EditEntityComparisonLayout
      currentContent={
        <Box sx={styles.fieldsColumn}>
          <Box sx={styles.fieldSection}>
            <Typography sx={styles.fieldLabel}>Welcome Message</Typography>
            <Box sx={styles.readOnlyCard}>
              {currentWelcome ? (
                <TextDiffHighlight
                  original={currentWelcome}
                  modified={suggestedWelcome}
                  mode="original"
                />
              ) : (
                <Typography sx={styles.emptyText}>No welcome message</Typography>
              )}
            </Box>
          </Box>
          {hasStarters && (
            <Box sx={styles.fieldSectionGrow}>
              <Typography sx={styles.sectionLabel}>Chat Starters:</Typography>
              <Box sx={styles.startersList}>
                {filteredCurrentStarters.map((starter, index) => {
                  const pairedSuggested = suggestedStarters[index];
                  const hasPair = pairedSuggested != null && pairedSuggested !== '';

                  return (
                    <Box
                      key={index}
                      sx={styles.readOnlyCard}
                    >
                      {hasPair ? (
                        <TextDiffHighlight
                          original={starter}
                          modified={pairedSuggested}
                          mode="original"
                        />
                      ) : (
                        <Typography sx={styles.starterText}>{starter}</Typography>
                      )}
                    </Box>
                  );
                })}
                {filteredCurrentStarters.length === 0 && (
                  <Typography sx={styles.emptyText}>No chat starters</Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      }
      suggestedContent={
        <Box sx={styles.fieldsColumn}>
          <Box sx={styles.fieldSection}>
            <Box sx={styles.fieldHeader}>
              <Typography sx={styles.fieldLabel}>Welcome Message</Typography>
              <Box sx={styles.applyToggle}>
                <Typography sx={styles.applyLabel}>Apply changes</Typography>
                <BaseCheckbox
                  size="small"
                  checked={fieldApplyFlags.welcome_message}
                  onChange={() => onToggleField('welcome_message')}
                  sx={styles.checkbox}
                />
              </Box>
            </Box>
            <Box sx={styles.editableCard}>
              <TextDiffHighlight
                original={currentWelcome}
                modified={suggestedWelcome}
                mode="modified"
                editable
                onChange={handleWelcomeChange}
              />
            </Box>
          </Box>
          {hasStarters && (
            <Box sx={styles.fieldSectionGrow}>
              <Box sx={styles.fieldHeader}>
                <Typography sx={styles.sectionLabel}>Chat Starters:</Typography>
                <Box sx={styles.applyToggle}>
                  <Typography sx={styles.applyLabel}>Apply changes</Typography>
                  <BaseCheckbox
                    size="small"
                    checked={fieldApplyFlags.conversation_starters}
                    onChange={() => onToggleField('conversation_starters')}
                    sx={styles.checkbox}
                  />
                </Box>
              </Box>
              <Box sx={styles.startersList}>
                {suggestedStarters.map((starter, index) => {
                  const pairedCurrent = filteredCurrentStarters[index];
                  const hasPair = pairedCurrent != null && pairedCurrent !== '';
                  const isOverLimit = starter && starter.length > MAX_CONVERSATION_STARTER_LENGTH;

                  return (
                    <Box
                      key={index}
                      sx={styles.starterRow}
                    >
                      <Box sx={styles.starterColumn}>
                        <Box
                          sx={[styles.editableStarterCard, isOverLimit && styles.editableStarterCardError]}
                        >
                          {hasPair ? (
                            <TextDiffHighlight
                              original={pairedCurrent}
                              modified={starter}
                              mode="modified"
                              editable
                              onChange={newText => handleStarterChange(index, newText)}
                            />
                          ) : (
                            <Input.InputBase
                              fullWidth
                              multiline
                              disableUnderline
                              value={starter}
                              onChange={e => handleStarterChange(index, e.target.value)}
                              enableAutoBlur={false}
                              sx={styles.starterInput}
                            />
                          )}
                        </Box>
                        {(isOverLimit || starter?.length > 0) && (
                          <Box sx={styles.starterFooter}>
                            {isOverLimit ? (
                              <Typography sx={styles.fieldError}>
                                {`Chat starter must be ${MAX_CONVERSATION_STARTER_LENGTH} characters or less`}
                              </Typography>
                            ) : (
                              <Box />
                            )}
                            <Text.CharacterCounter
                              value={starter}
                              maxLength={MAX_CONVERSATION_STARTER_LENGTH}
                              hideMaxLimitMessage
                              sx={styles.characterCounter}
                            />
                          </Box>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveStarter(index)}
                        sx={styles.removeBtn}
                      >
                        <CloseIcon sx={styles.removeIcon} />
                      </IconButton>
                    </Box>
                  );
                })}
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
                    {suggestedStarters.length}/{MAX_CONVERSATION_STARTERS} added.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      }
    />
  );
});

UserInteractionStep.displayName = 'UserInteractionStep';

/** @type {MuiSx} */
const styles = {
  fieldsColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
  },
  fieldSectionGrow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0 2rem 1.25rem',
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
  readOnlyCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '2.5rem',
    maxHeight: '5.5rem',
    overflowY: 'auto',
  }),
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    color: 'text.primary',
    textTransform: 'uppercase',
  },
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '2.5rem',
    maxHeight: '5.5rem',
    overflowY: 'auto',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  editableStarterCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '2.5rem',
    maxHeight: '5.5rem',
    overflowY: 'auto',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  editableStarterCardError: ({ palette }) => ({
    borderColor: palette.error.main,
    '&:hover': { borderColor: palette.error.main },
    '&:focus-within': { borderColor: palette.error.main },
  }),
  starterInput: ({ palette }) => ({
    '& .MuiInputBase-input': {
      padding: '0 !important',
      margin: '0 !important',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5rem',
      color: palette.text.secondary,
      caretColor: palette.text.secondary,
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
  startersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  starterColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  starterFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  starterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  starterText: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: 'text.secondary',
  },
  characterCounter: {
    textAlign: 'right',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: 'error.main',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
  },
  removeBtn: ({ palette }) => ({
    padding: '0.5rem',
    color: palette.text.default,
    '&:hover': {
      backgroundColor: palette.background.button.tertiary.hover,
    },
    '&:active': {
      backgroundColor: palette.background.button.tertiary.pressed,
    },
  }),
  removeIcon: {
    fontSize: '1rem',
  },
  addStarterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginTop: '1rem',
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

export default UserInteractionStep;
