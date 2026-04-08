import { memo, useCallback, useMemo, useState } from 'react';

import { Input } from '@/[fsd]/shared/ui';
import StyledInputModal from '@/components/StyledInputModal';
import { detectContentType } from '@/hooks/useCodeMirrorLanguageExtensions';

// Styled components exported for backward compatibility
// These are used by other components like ModerationActions

/**
 * StyledInputEnhancer - Enhanced input field with full-screen modal
 *
 * This component provides a standard input field with a full-screen modal view
 * for code editing and content management. Uses InputBase internally.
 *
 * Use this component for:
 * - Fields that need full-screen editing without AI assistance
 * - Standard text/code input with copy and expand/collapse features
 * - Any input field where AI Assistant is not required
 *
 * For AI Assistant functionality, use AIAssistantInput instead.
 */
const StyledInputEnhancer = memo(props => {
  const {
    showexpandicon = false,
    editswitcher = false,
    editswitchconfig = {},
    onDrop,
    onDragOver,
    onBlur,
    onChange,
    onKeyPress,
    value,
    containerProps = {},
    InputLabelProps,
    maxRows = null,
    minRows = 3,
    collapseContent = false,
    inputProps,
    hasActionsToolBar = false,
    showCopyAction = true,
    showFullScreenAction = true,
    showExpandAction = true,
    fieldName = '',
    enableAutoBlur = true,
    actionsBarProps = {},
    disableUnderline,
    onKeyDown,
    onInputModalClose,
    language,
    inputRef,
    variantInput,
    tooltipDescription,
    forceShowActionsToolbar,
    enableFStringAutocomplete,
    stateVariableOptions,
    ...leftProps
  } = props;

  const [showFullScreenInputModel, setShowFullScreenInputModel] = useState(false);

  const handleOpenFullScreen = useCallback(() => {
    setShowFullScreenInputModel(true);
  }, []);

  const handleCloseFullScreen = useCallback(() => {
    setShowFullScreenInputModel(false);
    onInputModalClose?.();
  }, [onInputModalClose]);

  const handleChange = useCallback(
    event => {
      if (onChange) onChange(event);
    },
    [onChange],
  );

  const detectedLanguage = useMemo(() => {
    return language || detectContentType(value);
  }, [language, value]);

  return (
    <>
      <Input.InputBase
        {...leftProps}
        value={value}
        onChange={onChange}
        inputProps={inputProps}
        onKeyDown={onKeyDown}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onBlur={onBlur}
        onKeyPress={onKeyPress}
        showexpandicon={showexpandicon}
        editswitcher={editswitcher}
        editswitchconfig={editswitchconfig}
        containerProps={containerProps}
        InputLabelProps={InputLabelProps}
        maxRows={maxRows}
        minRows={minRows}
        collapseContent={collapseContent}
        hasActionsToolBar={hasActionsToolBar}
        showCopyAction={showCopyAction}
        showFullScreenAction={showFullScreenAction}
        showExpandAction={showExpandAction}
        enableAutoBlur={enableAutoBlur}
        actionsBarProps={actionsBarProps}
        disableUnderline={disableUnderline}
        inputRef={inputRef}
        onFullScreen={handleOpenFullScreen}
        variant={variantInput}
        tooltipDescription={tooltipDescription}
        forceShowActionsToolbar={forceShowActionsToolbar}
      />
      {showFullScreenInputModel && (
        <StyledInputModal
          value={value}
          title={fieldName}
          key={showFullScreenInputModel}
          open={showFullScreenInputModel}
          hasOnChangeCallback={!!onChange}
          onChange={handleChange}
          onInput={leftProps.onInput}
          onClose={handleCloseFullScreen}
          onKeyDown={onKeyDown}
          inputProps={inputProps}
          specifiedLanguage={detectedLanguage}
          enableFStringAutocomplete={enableFStringAutocomplete}
          stateVariableOptions={stateVariableOptions}
          {...leftProps}
        />
      )}
    </>
  );
});

StyledInputEnhancer.displayName = 'StyledInputEnhancer';

export default StyledInputEnhancer;
