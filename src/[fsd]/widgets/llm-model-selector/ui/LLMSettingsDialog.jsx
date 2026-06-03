import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { VALIDATION_RULE, validateMaxTokens } from '@/[fsd]/widgets/llm-model-selector/lib';

import { LLMSettings } from './LLMSettings';

const LLMSettingsDialog = memo(props => {
  const {
    selectedModel,
    llmSettings = {},
    open,
    onApply,
    onCancel,
    showWebhookSecret = false,
    showStepsLimit = false,
    onResetToDefaults,
  } = props;

  const [localSettings, setLocalSettings] = useState(llmSettings);

  const onChangeLLMSettings = useCallback(
    field => value => {
      setLocalSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleOK = useCallback(() => onApply(localSettings), [localSettings, onApply]);

  const isDisabled = useMemo(() => {
    const validationResult = validateMaxTokens(localSettings?.max_tokens, selectedModel);
    return validationResult !== VALIDATION_RULE.VALID;
  }, [localSettings?.max_tokens, selectedModel]);

  useEffect(() => {
    setLocalSettings(llmSettings);
  }, [llmSettings, open]);

  return (
    <Modal.BaseModal
      open={open}
      title="Model settings"
      titleVariant="headingMedium"
      onClose={onCancel}
      content={
        <LLMSettings
          llmSettings={localSettings}
          model={selectedModel}
          onChangeLLMSettings={onChangeLLMSettings}
          showWebhookSecret={showWebhookSecret}
          showStepsLimit={showStepsLimit}
        />
      }
      actions={
        <>
          {onResetToDefaults && (
            <Button.BaseBtn
              variant="elitea"
              color="secondary"
              onClick={() => {
                onResetToDefaults();
                onCancel();
              }}
            >
              Reset to defaults
            </Button.BaseBtn>
          )}
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant="elitea"
            onClick={handleOK}
            disabled={isDisabled}
          >
            Apply
          </Button.BaseBtn>
        </>
      }
    />
  );
});

LLMSettingsDialog.displayName = 'LLMSettingsDialog';

export { LLMSettingsDialog };
