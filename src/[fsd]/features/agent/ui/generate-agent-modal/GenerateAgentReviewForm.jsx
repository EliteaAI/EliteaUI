import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { validateAgentDraft } from '@/[fsd]/features/agent/lib/helpers';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input, Text } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';
import {
  MAX_CONVERSATION_STARTERS,
  MAX_CONVERSATION_STARTER_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_WELCOME_MESSAGE_LENGTH,
} from '@/common/constants.js';
import CloseIcon from '@/components/Icons/CloseIcon';

import ResourceSuggestions from './ResourceSuggestions';

const GenerateAgentReviewForm = memo(props => {
  const {
    draft,
    onChange,
    onValidationChange,
    selectedToolkitIds,
    onToggleToolkit,
    selectedAgentIds,
    onToggleAgent,
    selectedMcpIds,
    onToggleMcp,
    selectedPipelineIds,
    onTogglePipeline,
    selectedSkillIds,
    onToggleSkill,
  } = props;

  const styles = generateAgentReviewFormStyles();
  const { toggleFieldFocus, isFocused } = useFieldFocus();

  const validationErrors = useMemo(() => validateAgentDraft(draft), [draft]);

  const isValid = useMemo(() => Object.keys(validationErrors).length === 0, [validationErrors]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleFieldChange = useCallback(
    (field, value) => {
      onChange({ ...draft, [field]: value });
    },
    [draft, onChange],
  );

  const handleStarterChange = useCallback(
    (index, value) => {
      const updated = [...(draft.conversation_starters || [])];
      updated[index] = value;
      onChange({ ...draft, conversation_starters: updated });
    },
    [draft, onChange],
  );

  const handleRemoveStarter = useCallback(
    index => {
      const updated = (draft.conversation_starters || []).filter((_, i) => i !== index);
      onChange({ ...draft, conversation_starters: updated });
    },
    [draft, onChange],
  );

  const handleAddStarter = useCallback(() => {
    const updated = [...(draft.conversation_starters || []), ''];
    onChange({ ...draft, conversation_starters: updated });
  }, [draft, onChange]);

  const starters = useMemo(() => draft.conversation_starters || [], [draft.conversation_starters]);

  const disableAddStarter = useMemo(
    () => starters.length >= MAX_CONVERSATION_STARTERS || starters.some(s => !s?.trim()),
    [starters],
  );

  const addStarterTooltip = useMemo(() => {
    if (starters.length >= MAX_CONVERSATION_STARTERS) return 'You have reached the limit of chat starters';
    return '';
  }, [starters]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Input.InputBase
          label="Name"
          variant={Input.INPUT_VARIANTS.outlined}
          fullWidth
          size="small"
          value={draft.name || ''}
          onChange={e => handleFieldChange('name', e.target.value)}
          onFocus={() => toggleFieldFocus('name')}
          onBlur={() => toggleFieldFocus(null)}
          slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
          helperText={validationErrors.name}
          error={!!validationErrors.name}
          sx={styles.compactMultilineInput}
        />
        {isFocused('name') && (
          <Text.CharacterCounter
            value={draft.name || ''}
            maxLength={MAX_NAME_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
      </Box>

      <Box sx={styles.field}>
        <Input.InputBase
          label="Description"
          variant={Input.INPUT_VARIANTS.outlined}
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={4}
          value={draft.description || ''}
          onChange={e => handleFieldChange('description', e.target.value)}
          onFocus={() => toggleFieldFocus('description')}
          onBlur={() => toggleFieldFocus(null)}
          slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
          helperText={validationErrors.description}
          error={!!validationErrors.description}
        />
        {isFocused('description') && (
          <Text.CharacterCounter
            value={draft.description || ''}
            maxLength={MAX_DESCRIPTION_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
      </Box>

      <Box sx={styles.field}>
        <Input.InputBase
          label="Instructions"
          variant={Input.INPUT_VARIANTS.outlined}
          fullWidth
          size="small"
          multiline
          minRows={4}
          maxRows={10}
          value={draft.instructions || ''}
          onChange={e => handleFieldChange('instructions', e.target.value)}
        />
      </Box>

      <Box sx={styles.field}>
        <Input.InputBase
          variant={Input.INPUT_VARIANTS.outlined}
          label="Welcome Message"
          multiline
          minRows={1}
          maxRows={4}
          value={draft.welcome_message || ''}
          onChange={e => handleFieldChange('welcome_message', e.target.value)}
          onFocus={() => toggleFieldFocus('welcome_message')}
          onBlur={() => toggleFieldFocus(null)}
          slotProps={{ htmlInput: { maxLength: MAX_WELCOME_MESSAGE_LENGTH } }}
          helperText={validationErrors.welcome_message}
          error={!!validationErrors.welcome_message}
          hasActionsToolBar={false}
          sx={styles.compactMultilineInput}
        />
        {isFocused('welcome_message') && (
          <Text.CharacterCounter
            value={draft.welcome_message || ''}
            maxLength={MAX_WELCOME_MESSAGE_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
      </Box>

      {starters.length > 0 && (
        <Box sx={styles.section}>
          <Typography sx={styles.sectionLabel}>Chat starters:</Typography>
          <Box sx={styles.startersList}>
            {starters.map((starter, index) => (
              <Box
                key={index}
                sx={styles.starterInputWrapper}
              >
                <Box sx={styles.starterRow}>
                  <Input.InputBase
                    variant={Input.INPUT_VARIANTS.outlined}
                    multiline
                    minRows={1}
                    maxRows={4}
                    value={starter}
                    onChange={e => handleStarterChange(index, e.target.value)}
                    onFocus={() => toggleFieldFocus(`starter_${index}`)}
                    onBlur={() => toggleFieldFocus(null)}
                    slotProps={{ htmlInput: { maxLength: MAX_CONVERSATION_STARTER_LENGTH } }}
                    error={
                      (!starter?.trim() && starter !== undefined) ||
                      starter?.length > MAX_CONVERSATION_STARTER_LENGTH
                    }
                    helperText={
                      starter?.length > MAX_CONVERSATION_STARTER_LENGTH
                        ? `Chat starter must be ${MAX_CONVERSATION_STARTER_LENGTH} characters or less`
                        : undefined
                    }
                    hasActionsToolBar={false}
                    sx={styles.compactMultilineInput}
                    containerProps={{ sx: { flex: 1 } }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveStarter(index)}
                    sx={styles.removeBtn}
                  >
                    <CloseIcon sx={styles.removeIcon} />
                  </IconButton>
                </Box>
                {isFocused(`starter_${index}`) && (
                  <Text.CharacterCounter
                    value={starter || ''}
                    maxLength={MAX_CONVERSATION_STARTER_LENGTH}
                    hideMaxLimitMessage
                    sx={styles.characterCounter}
                  />
                )}
              </Box>
            ))}
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
                    sx={styles.addStarterBtn}
                    startIcon={<PlusIcon />}
                  >
                    Starter
                  </BaseBtn>
                </Box>
              </Tooltip>
              <Typography sx={styles.addedCount}>
                {starters.length}/{MAX_CONVERSATION_STARTERS} added.
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <ResourceSuggestions
        title="Suggested Toolkits:"
        items={draft.suggested_toolkits}
        selectedIds={selectedToolkitIds}
        onToggle={onToggleToolkit}
        entityType="toolkit"
      />

      <ResourceSuggestions
        title="Suggested MCP:"
        items={draft.suggested_mcp}
        selectedIds={selectedMcpIds}
        onToggle={onToggleMcp}
        entityType="mcp"
      />

      <ResourceSuggestions
        title="Suggested Pipelines:"
        items={draft.suggested_pipelines}
        selectedIds={selectedPipelineIds}
        onToggle={onTogglePipeline}
        entityType="pipeline"
      />

      <ResourceSuggestions
        title="Suggested Agents:"
        items={draft.suggested_agents}
        selectedIds={selectedAgentIds}
        onToggle={onToggleAgent}
        entityType="agent"
      />

      <ResourceSuggestions
        title="Suggested Skills:"
        items={draft.suggested_skills}
        selectedIds={selectedSkillIds}
        onToggle={onToggleSkill}
        entityType="skill"
      />
    </Box>
  );
});

GenerateAgentReviewForm.displayName = 'GenerateAgentReviewForm';

const generateAgentReviewFormStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
    alignItems: 'center',
    gap: '0.625rem',
  },
  starterInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
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
  characterCounter: {
    textAlign: 'right',
  },
  compactMultilineInput: {
    '& .MuiOutlinedInput-input.MuiInputBase-inputMultiline': {
      minHeight: 'auto !important',
    },
  },
});

export default GenerateAgentReviewForm;
