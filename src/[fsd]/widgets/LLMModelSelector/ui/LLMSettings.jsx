import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box } from '@mui/material';

import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MAX_TOKENS_CUSTOM,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_STEPS_LIMIT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import {
  VALIDATION_RULE,
  getMaxTokensHelperText,
  validateMaxTokens,
} from '@/[fsd]/widgets/LLMModelSelector/lib/validation';
import {
  CapabilitySection,
  CreativitySlider,
  MaxTokensSection,
  ReasoningSlider,
  StepsLimitInput,
} from '@/[fsd]/widgets/LLMModelSelector/ui/settings';
import { PROMPT_PAYLOAD_KEY } from '@/common/constants';
import { isNullOrUndefined, parseValueToIntNumber } from '@/common/utils';
import { SecretField } from '@/components/SecretManagementInput';

const LLMSettings = memo(props => {
  const {
    llmSettings = {},
    model = {},
    onChangeLLMSettings,
    showWebhookSecret = false,
    showStepsLimit = false,
  } = props;

  const focusOnMaxTokens = useRef(false);

  // Initialize with DEFAULT_MAX_TOKENS if max_tokens is DEFAULT_MAX_TOKENS (auto mode), otherwise use the value or default
  const [maxTokens, setMaxTokens] = useState(
    llmSettings?.max_tokens === DEFAULT_MAX_TOKENS
      ? DEFAULT_MAX_TOKENS
      : llmSettings?.max_tokens || DEFAULT_MAX_TOKENS_CUSTOM,
  );

  const onMaxTokensBlur = useCallback(() => {
    focusOnMaxTokens.current = false;
    setTimeout(() => {
      // Don't set default if maxTokens is DEFAULT_MAX_TOKENS (auto mode)
      if (!focusOnMaxTokens.current && maxTokens !== DEFAULT_MAX_TOKENS && !maxTokens) {
        onChangeLLMSettings(PROMPT_PAYLOAD_KEY.maxTokens)(DEFAULT_MAX_TOKENS);
        setMaxTokens(DEFAULT_MAX_TOKENS);
      } else {
        if (maxTokens !== llmSettings?.max_tokens) {
          // Handle DEFAULT_MAX_TOKENS (auto mode) and integer values
          onChangeLLMSettings(PROMPT_PAYLOAD_KEY.maxTokens)(
            maxTokens === DEFAULT_MAX_TOKENS ? DEFAULT_MAX_TOKENS : parseInt(maxTokens),
          );
        }
      }
    }, 50);
  }, [llmSettings?.max_tokens, maxTokens, onChangeLLMSettings]);

  const onMaxTokensFocus = useCallback(() => {
    focusOnMaxTokens.current = true;
  }, []);

  const onInputMaxTokens = useCallback(
    eventOrValue => {
      // Handle both event objects and direct values (DEFAULT_MAX_TOKENS for auto mode)
      if (eventOrValue === DEFAULT_MAX_TOKENS) {
        // Auto mode - set to DEFAULT_MAX_TOKENS
        onChangeLLMSettings(PROMPT_PAYLOAD_KEY.maxTokens)(DEFAULT_MAX_TOKENS);
        setMaxTokens(DEFAULT_MAX_TOKENS);
        return;
      }

      // Handle event object (custom mode input)
      if (eventOrValue?.preventDefault) {
        eventOrValue.preventDefault();
      }

      const value = eventOrValue?.target?.value ?? eventOrValue;
      const maximumTokens = parseValueToIntNumber(value);

      onChangeLLMSettings(PROMPT_PAYLOAD_KEY.maxTokens)(maximumTokens);
      setMaxTokens(maximumTokens);

      if (eventOrValue?.target) {
        eventOrValue.target.value = maximumTokens;
      }
    },
    [onChangeLLMSettings],
  );

  const onChangeWebhookSecret = useCallback(
    (e, value) => {
      onChangeLLMSettings(PROMPT_PAYLOAD_KEY.webhookSecret)(value);
    },
    [onChangeLLMSettings],
  );

  useEffect(() => {
    if (llmSettings?.max_tokens !== maxTokens) {
      setMaxTokens(llmSettings?.max_tokens);
    }
  }, [llmSettings?.max_tokens, maxTokens]);

  const initializeDefaultLLMSettings = useCallback(() => {
    if (isNullOrUndefined(llmSettings.temperature)) {
      onChangeLLMSettings(PROMPT_PAYLOAD_KEY.temperature)(DEFAULT_TEMPERATURE);
    }
    // Only set default for max_tokens if it's undefined (not set), not if it's DEFAULT_MAX_TOKENS (auto mode)
    if (llmSettings.max_tokens === undefined) {
      onChangeLLMSettings(PROMPT_PAYLOAD_KEY.maxTokens)(DEFAULT_MAX_TOKENS);
    }

    if (model?.supports_reasoning && isNullOrUndefined(llmSettings.reasoning_effort)) {
      onChangeLLMSettings(PROMPT_PAYLOAD_KEY.reasoningEffort)(DEFAULT_REASONING_EFFORT);
    }

    if (showStepsLimit && isNullOrUndefined(llmSettings.steps_limit)) {
      onChangeLLMSettings(PROMPT_PAYLOAD_KEY.stepsLimit)(DEFAULT_STEPS_LIMIT);
    }
  }, [
    llmSettings.temperature,
    llmSettings.max_tokens,
    llmSettings.reasoning_effort,
    llmSettings.steps_limit,
    model?.supports_reasoning,
    showStepsLimit,
    onChangeLLMSettings,
  ]);

  useEffect(() => {
    initializeDefaultLLMSettings();
  }, [initializeDefaultLLMSettings]);

  const { maxTokensError, maxTokensHelperText } = useMemo(() => {
    const maxTokensValidation = validateMaxTokens(maxTokens, model);
    return {
      maxTokensError: maxTokensValidation !== VALIDATION_RULE.VALID,
      maxTokensHelperText: getMaxTokensHelperText(maxTokensValidation, model),
    };
  }, [maxTokens, model]);

  return (
    <Box sx={styles.container}>
      {model?.supports_reasoning ? (
        <ReasoningSlider
          value={llmSettings.reasoning_effort || DEFAULT_REASONING_EFFORT}
          onChange={onChangeLLMSettings(PROMPT_PAYLOAD_KEY.reasoningEffort)}
          disabled={false}
        />
      ) : (
        <CreativitySlider
          temperature={llmSettings.temperature ?? DEFAULT_TEMPERATURE}
          onChange={onChangeLLMSettings(PROMPT_PAYLOAD_KEY.temperature)}
        />
      )}
      <MaxTokensSection
        value={maxTokens}
        onChange={onInputMaxTokens}
        onBlur={onMaxTokensBlur}
        onFocus={onMaxTokensFocus}
        maxOutputTokens={model?.max_output_tokens}
        error={maxTokensError}
        helperText={maxTokensHelperText}
      />
      {showStepsLimit && (
        <StepsLimitInput
          value={llmSettings.steps_limit ?? DEFAULT_STEPS_LIMIT}
          onChange={onChangeLLMSettings(PROMPT_PAYLOAD_KEY.stepsLimit)}
        />
      )}
      {showWebhookSecret && (
        <SecretField
          label={'Webhook secret'}
          value={llmSettings.webhook_secret || null}
          onChange={onChangeWebhookSecret}
          passwordVisibilityToggle={false}
          required={false}
        />
      )}
      <CapabilitySection
        supportsVision={model?.supports_vision}
        supportsReasoning={model?.supports_reasoning}
      />
    </Box>
  );
});

LLMSettings.displayName = 'LLMSettings';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    padding: '0 1rem',
  },
};

export { LLMSettings };
