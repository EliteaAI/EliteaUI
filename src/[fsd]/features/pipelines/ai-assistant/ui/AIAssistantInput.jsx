import { memo, useCallback, useMemo, useState } from 'react';

import { AIAssistantModal } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { Input } from '@/[fsd]/shared/ui';
import AIAssistantIcon from '@/assets/ai-assistant-icon.svg?react';
import { detectContentType } from '@/hooks/useCodeMirrorLanguageExtensions';

const AIAssistantInput = memo(props => {
  const {
    modelConfig = null,
    fieldName = '',
    value = '',
    language,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
    ...leftProps
  } = props;

  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);

  const handleOpenAIAssistant = useCallback(() => {
    setShowAIAssistantModal(true);
  }, []);

  const handleCloseAIAssistant = useCallback(() => {
    setShowAIAssistantModal(false);
  }, []);

  const detectedLanguage = useMemo(() => {
    return language || detectContentType(value);
  }, [language, value]);

  return (
    <>
      <Input.InputBase
        value={value}
        fieldName={fieldName}
        onFullScreen={handleOpenAIAssistant}
        showFullScreenAction
        fullScreenIcon={<AIAssistantIcon sx={{ fontSize: 16 }} />}
        {...leftProps}
      />
      {showAIAssistantModal && (
        <AIAssistantModal
          value={value}
          title={fieldName}
          fieldName={fieldName} // Pass fieldName to modal
          key={showAIAssistantModal}
          open={showAIAssistantModal}
          onClose={handleCloseAIAssistant}
          specifiedLanguage={detectedLanguage}
          modelConfig={modelConfig}
          enableFStringAutocomplete={enableFStringAutocomplete}
          stateVariableOptions={stateVariableOptions}
          {...leftProps}
        />
      )}
    </>
  );
});

AIAssistantInput.displayName = 'AIAssistantInput';

export default AIAssistantInput;
