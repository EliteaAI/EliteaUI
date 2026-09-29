import { memo, useCallback, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { Checkbox, Select } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';
import {
  getDefaultEffortOptions,
  getEffortLevelLabel,
  getEffortLevelOptions,
  getRemovedEffortLevels,
  isLlmModelReasoningConfigured,
  toggleEffortLevel,
} from '../../lib/helpers/llmModelProfiles.helpers.js';
import LlmModelField from './LlmModelField';
import LlmModelThinkingModeValue from './LlmModelThinkingModeValue';

const {
  LLM_MODEL_DEFAULT_EFFORT_PLACEHOLDERS,
  LLM_MODEL_EFFORT_LEVELS_HELPER_TEXTS,
  LLM_MODEL_EFFORT_NONE,
  LLM_MODEL_EFFORT_NONE_WARNING,
  LLM_MODEL_FIELDS: FIELDS,
  LLM_MODEL_REASONING_NOT_CONFIGURED_NOTE,
  LLM_MODEL_REMOVED_EFFORTS_WARNING,
  LLM_MODEL_THINKING_TYPE_CHOICE_HELPER_TEXT,
  LLM_MODEL_THINKING_TYPE_FIXED_HELPER_TEXTS,
  LLM_MODEL_THINKING_TYPE_NOT_SET,
  LLM_MODEL_THINKING_TYPE_OPTIONS,
} = LlmModelFormConstants;

const LlmModelReasoningPanel = memo(props => {
  const { settings, initialSettings, isEditing, profile, effortLevels, visibleErrors, editSetting } = props;
  const styles = llmModelReasoningPanelStyles();
  const isRecognized = Boolean(profile?.supports_reasoning);
  const isConfigured = isLlmModelReasoningConfigured(settings);
  const storedEfforts = settings[FIELDS.supportedEfforts];
  const supportedEfforts = useMemo(() => storedEfforts || [], [storedEfforts]);

  const effortOptions = useMemo(
    () => getEffortLevelOptions(profile, effortLevels, supportedEfforts),
    [profile, effortLevels, supportedEfforts],
  );
  const defaultEffortOptions = useMemo(() => getDefaultEffortOptions(supportedEfforts), [supportedEfforts]);
  const removedLevels = useMemo(
    () =>
      isEditing ? getRemovedEffortLevels(initialSettings?.[FIELDS.supportedEfforts], supportedEfforts) : [],
    [isEditing, initialSettings, supportedEfforts],
  );

  const onEffortToggle = useCallback(
    event => {
      const orderedLevels = effortOptions.map(option => option.value);
      const nextEfforts = toggleEffortLevel(supportedEfforts, event.target.value, orderedLevels);
      editSetting(FIELDS.supportedEfforts, nextEfforts);
      if (settings[FIELDS.defaultEffort] && !nextEfforts.includes(settings[FIELDS.defaultEffort])) {
        editSetting(FIELDS.defaultEffort, null);
      }
    },
    [editSetting, effortOptions, settings, supportedEfforts],
  );

  const onDefaultEffortChange = useCallback(level => editSetting(FIELDS.defaultEffort, level), [editSetting]);

  const onThinkingTypeChange = useCallback(
    thinkingType => editSetting(FIELDS.thinkingType, thinkingType || null),
    [editSetting],
  );

  const fixedThinkingType = isRecognized ? settings[FIELDS.thinkingType] || profile.thinking_type : null;
  const isThinkingTypeShown = !isRecognized || Boolean(fixedThinkingType);
  const effortWarnings = [
    supportedEfforts.includes(LLM_MODEL_EFFORT_NONE) && LLM_MODEL_EFFORT_NONE_WARNING,
    removedLevels.length > 0 && LLM_MODEL_REMOVED_EFFORTS_WARNING(removedLevels.map(getEffortLevelLabel)),
  ].filter(Boolean);

  return (
    <Box
      sx={styles.panel}
      data-testid="llm-model-reasoning-panel"
    >
      {!isConfigured && (
        <Typography
          variant="bodySmall"
          sx={styles.note}
          data-testid="llm-model-reasoning-not-configured"
        >
          {LLM_MODEL_REASONING_NOT_CONFIGURED_NOTE}
        </Typography>
      )}
      {isThinkingTypeShown && (
        <LlmModelField
          field={FIELDS.thinkingType}
          error={visibleErrors[FIELDS.thinkingType]}
          helperText={
            fixedThinkingType
              ? LLM_MODEL_THINKING_TYPE_FIXED_HELPER_TEXTS[fixedThinkingType]
              : LLM_MODEL_THINKING_TYPE_CHOICE_HELPER_TEXT
          }
        >
          {fixedThinkingType ? (
            <LlmModelThinkingModeValue thinkingType={fixedThinkingType} />
          ) : (
            <Select.SingleSelect
              id={`llm-model-${FIELDS.thinkingType}`}
              data-testid="llm-model-thinking-type-select"
              value={settings[FIELDS.thinkingType] ?? LLM_MODEL_THINKING_TYPE_NOT_SET}
              options={LLM_MODEL_THINKING_TYPE_OPTIONS}
              onValueChange={onThinkingTypeChange}
              error={Boolean(visibleErrors[FIELDS.thinkingType])}
              showBorder
              displayEmpty
              showEmptyPlaceholder={false}
              customSelectedFontSize="0.875rem"
            />
          )}
        </LlmModelField>
      )}
      <LlmModelField
        field={FIELDS.supportedEfforts}
        required
        error={visibleErrors[FIELDS.supportedEfforts]}
        warning={effortWarnings.length ? effortWarnings.join('\n') : undefined}
        helperText={
          isRecognized
            ? LLM_MODEL_EFFORT_LEVELS_HELPER_TEXTS.recognized
            : LLM_MODEL_EFFORT_LEVELS_HELPER_TEXTS.unrecognized
        }
      >
        <Box
          sx={styles.levels}
          role="group"
          aria-label="Supported effort levels"
          data-testid="llm-model-supported-efforts-group"
        >
          {effortOptions.map(option => (
            <FormControlLabel
              key={option.value}
              sx={styles.level}
              label={
                <Typography
                  variant="bodyMedium"
                  sx={option.unsupported ? styles.unsupportedLevel : undefined}
                >
                  {option.label}
                </Typography>
              }
              control={
                <Checkbox.BaseCheckbox
                  value={option.value}
                  checked={supportedEfforts.includes(option.value)}
                  onChange={onEffortToggle}
                  inputProps={{
                    'aria-label': option.label,
                    'data-testid': `llm-model-effort-${option.value}`,
                  }}
                />
              }
            />
          ))}
        </Box>
      </LlmModelField>
      <LlmModelField
        field={FIELDS.defaultEffort}
        required
        error={visibleErrors[FIELDS.defaultEffort]}
      >
        <Select.SingleSelect
          id={`llm-model-${FIELDS.defaultEffort}`}
          data-testid="llm-model-default-effort-select"
          value={settings[FIELDS.defaultEffort] ?? ''}
          options={defaultEffortOptions}
          onValueChange={onDefaultEffortChange}
          error={Boolean(visibleErrors[FIELDS.defaultEffort])}
          disabled={!defaultEffortOptions.length}
          emptyPlaceholder={
            defaultEffortOptions.length
              ? LLM_MODEL_DEFAULT_EFFORT_PLACEHOLDERS.select
              : LLM_MODEL_DEFAULT_EFFORT_PLACEHOLDERS.noLevels
          }
          showBorder
          displayEmpty
          customSelectedFontSize="0.875rem"
        />
      </LlmModelField>
    </Box>
  );
});

LlmModelReasoningPanel.displayName = 'LlmModelReasoningPanel';

/** @type {MuiSx} */
const llmModelReasoningPanelStyles = () => ({
  panel: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginTop: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${palette.border.lines}`,
  }),
  note: ({ palette }) => ({
    color: palette.text.primary,
  }),
  levels: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0 1rem',
  },
  level: {
    marginLeft: 0,
    marginRight: 0,
  },
  unsupportedLevel: ({ palette }) => ({
    color: palette.text.attention,
    textDecoration: 'line-through',
  }),
});

export default LlmModelReasoningPanel;
