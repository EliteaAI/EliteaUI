import { memo, useCallback, useMemo, useState } from 'react';

import { AIAssistantModal } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { CodeMirrorEditorHelpers } from '@/[fsd]/shared/lib/helpers';
import { Input } from '@/[fsd]/shared/ui';
import AIAssistantIcon from '@/assets/ai-assistant-icon.svg?react';
import StyledInputModal from '@/components/StyledInputModal';

const AIAssistantInput = memo(props => {
  const {
    modelConfig = null,
    fieldName = '',
    value = '',
    language,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
    // Node fields open the value in full screen instead of expanding it inline
    // eslint-disable-next-line no-unused-vars
    showExpandAction,
    ...leftProps
  } = props;

  const [showAIAssistantModal, setShowAIAssistantModal] = useState(false);
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);

  const handleOpenAIAssistant = useCallback(() => {
    setShowAIAssistantModal(true);
  }, []);

  const handleCloseAIAssistant = useCallback(() => {
    setShowAIAssistantModal(false);
  }, []);

  const handleOpenFullScreen = useCallback(() => {
    setShowFullScreenModal(true);
  }, []);

  const handleCloseFullScreen = useCallback(() => {
    setShowFullScreenModal(false);
  }, []);

  const detectedLanguage = useMemo(() => {
    return language || CodeMirrorEditorHelpers.detectContentType(value);
  }, [language, value]);

  const extraActions = useMemo(
    () => [
      {
        key: 'ai-assistant',
        title: 'AI Assistant',
        icon: <AIAssistantIcon sx={{ fontSize: 16 }} />,
        onClick: handleOpenAIAssistant,
        buttonProps: { 'aria-label': 'AI Assistant', 'data-testid': 'ai-assistant-button' },
      },
    ],
    [handleOpenAIAssistant],
  );

  return (
    <>
      <Input.InputBase
        value={value}
        fieldName={fieldName}
        extraActions={extraActions}
        onFullScreen={handleOpenFullScreen}
        showFullScreenAction
        fullScreenButtonProps={{
          'aria-label': 'Full screen view',
          'data-testid': 'ai-assistant-input-full-screen',
        }}
        showExpandAction={false}
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
      {showFullScreenModal && (
        <StyledInputModal
          value={value}
          title={fieldName}
          open={showFullScreenModal}
          hasOnChangeCallback={!!leftProps.onChange}
          onChange={leftProps.onChange}
          onInput={leftProps.onInput}
          onClose={handleCloseFullScreen}
          name={leftProps.name}
          id={leftProps.id}
          disabled={leftProps.disabled}
          specifiedLanguage={detectedLanguage}
          enableFStringAutocomplete={enableFStringAutocomplete}
          stateVariableOptions={stateVariableOptions}
          data-testid="ai-assistant-input-full-screen-modal"
        />
      )}
    </>
  );
});

AIAssistantInput.displayName = 'AIAssistantInput';

export default AIAssistantInput;
