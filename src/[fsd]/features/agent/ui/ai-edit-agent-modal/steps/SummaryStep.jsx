import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { resolveEntityType } from '@/[fsd]/entities/edit-entity-with-ai/lib/helpers';
import { Input, Text } from '@/[fsd]/shared/ui';
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

import ToolItemCard from './ToolItemCard';

const normalizeToolItem = (item, entityType) => ({
  ...item,
  entityType: item.entity_type || entityType,
});

const SummaryStep = memo(props => {
  const {
    currentData,
    currentTools = [],
    draftData,
    onDraftChange,
    fieldApplyFlags,
    onToggleField,
    toolSelections,
  } = props;

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

  const mergedTools = useMemo(() => {
    const currentKeys = new Set(currentTools.map(t => `${resolveEntityType(t)}:${t.id}`));

    const allSuggestedKeys = new Set([
      ...(draftData?.suggested_toolkits || []).map(t => `toolkit:${t.id}`),
      ...(draftData?.suggested_mcp || []).map(m => `mcp:${m.id}`),
      ...(draftData?.suggested_agents || []).map(a => `agent:${a.id}`),
      ...(draftData?.suggested_pipelines || []).map(p => `pipeline:${p.id}`),
      ...(draftData?.suggested_skills || []).map(s => `skill:${s.id}`),
    ]);

    const kept = currentTools
      .filter(t => {
        const key = `${resolveEntityType(t)}:${t.id}`;
        if (allSuggestedKeys.has(key)) return toolSelections?.toKeep?.has(key);
        return !toolSelections?.toRemove?.has(key);
      })
      .map(item => normalizeToolItem(item, resolveEntityType(item)));

    const addItems = [
      ...(draftData?.suggested_toolkits || []).map(item => normalizeToolItem(item, 'toolkit')),
      ...(draftData?.suggested_mcp || []).map(item => normalizeToolItem(item, 'mcp')),
      ...(draftData?.suggested_agents || []).map(item => normalizeToolItem(item, 'agent')),
      ...(draftData?.suggested_pipelines || []).map(item => normalizeToolItem(item, 'pipeline')),
      ...(draftData?.suggested_skills || []).map(item => normalizeToolItem(item, 'skill')),
    ].filter(
      item =>
        toolSelections?.toAdd?.has(`${item.entityType}:${item.id}`) &&
        !currentKeys.has(`${item.entityType}:${item.id}`),
    );

    return [...kept, ...addItems];
  }, [currentTools, draftData, toolSelections]);

  const handleFieldChange = useCallback(
    (field, value) => {
      if (!fieldApplyFlags[field]) onToggleField(field);
      onDraftChange({ ...draftData, [field]: value });
    },
    [draftData, fieldApplyFlags, onDraftChange, onToggleField],
  );

  const handleStarterChange = useCallback(
    (index, value) => {
      if (!fieldApplyFlags.conversation_starters) onToggleField('conversation_starters');
      const updated = [...mergedStarters];
      updated[index] = value;
      onDraftChange({ ...draftData, conversation_starters: updated });
    },
    [draftData, fieldApplyFlags, mergedStarters, onDraftChange, onToggleField],
  );

  const handleRemoveStarter = useCallback(
    index => {
      if (!fieldApplyFlags.conversation_starters) onToggleField('conversation_starters');
      const updated = mergedStarters.filter((_, i) => i !== index);
      onDraftChange({ ...draftData, conversation_starters: updated });
    },
    [draftData, fieldApplyFlags, mergedStarters, onDraftChange, onToggleField],
  );

  const handleAddStarter = useCallback(() => {
    if (!fieldApplyFlags.conversation_starters) onToggleField('conversation_starters');
    const updated = [...mergedStarters, ''];
    onDraftChange({ ...draftData, conversation_starters: updated });
  }, [draftData, fieldApplyFlags, mergedStarters, onDraftChange, onToggleField]);

  const disableAddStarter = useMemo(
    () => mergedStarters.length >= MAX_CONVERSATION_STARTERS || mergedStarters.some(s => !s?.trim()),
    [mergedStarters],
  );

  const addStarterTooltip = useMemo(() => {
    if (mergedStarters.length >= MAX_CONVERSATION_STARTERS)
      return 'You have reached the limit of chat starters';
    return '';
  }, [mergedStarters]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Typography sx={styles.label}>Name</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            value={mergedName}
            onChange={e => handleFieldChange('name', e.target.value)}
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        {mergedName.length > 0 && (
          <Text.CharacterCounter
            value={mergedName}
            maxLength={MAX_NAME_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Description</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            multiline
            maxRows={3}
            value={mergedDescription}
            onChange={e => handleFieldChange('description', e.target.value)}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        {mergedDescription.length > 0 && (
          <Text.CharacterCounter
            value={mergedDescription}
            maxLength={MAX_DESCRIPTION_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
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
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Welcome Message</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            multiline
            maxRows={3}
            value={mergedWelcome}
            onChange={e => handleFieldChange('welcome_message', e.target.value)}
            inputProps={{ maxLength: MAX_WELCOME_MESSAGE_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
      </Box>

      <Box sx={styles.section}>
        <Typography sx={styles.sectionLabel}>Chat starters:</Typography>
        <Box sx={styles.startersList}>
          {mergedStarters.map((starter, index) => (
            <Box
              key={index}
              sx={styles.starterRow}
            >
              <Box sx={styles.starterCard}>
                <Input.InputBase
                  fullWidth
                  multiline
                  maxRows={3}
                  minRows={1}
                  disableUnderline
                  value={starter}
                  onChange={e => handleStarterChange(index, e.target.value)}
                  inputProps={{ maxLength: MAX_CONVERSATION_STARTER_LENGTH }}
                  enableAutoBlur={false}
                  sx={styles.starterInput}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => handleRemoveStarter(index)}
                sx={styles.removeBtn}
              >
                <CloseIcon sx={styles.removeIcon} />
              </IconButton>
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
        </Box>
      </Box>

      {mergedTools.length > 0 && (
        <Box sx={styles.section}>
          <Typography sx={styles.sectionLabel}>Tools & Skills:</Typography>
          <Box sx={styles.toolsList}>
            {mergedTools.map(item => (
              <ToolItemCard
                key={item.id}
                item={item}
                entityType={item.entityType}
              />
            ))}
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
    paddingBlock: '1rem 1.25rem',
    paddingInline: 'max(2rem, calc((100% - 46rem) / 2))',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
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
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  cardInput: ({ palette }) => ({
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
  starterCard: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
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
  starterRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
  },
  removeBtn: ({ palette }) => ({
    padding: '0.5rem',
    color: palette.text.default,
    marginTop: '0.25rem',
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
  },
  addStarterWrapper: {
    display: 'inline-flex',
  },
  addedCount: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: 'text.primary',
  },
  toolsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  characterCounter: {
    alignSelf: 'flex-end',
  },
};

export default SummaryStep;
