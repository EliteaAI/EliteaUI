import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Box } from '@mui/material';

import { AIAssistantCodeMirrorInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { Field, Modal, Text } from '@/[fsd]/shared/ui';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';

const StyledInputModal = forwardRef((props, ref) => {
  const {
    open,
    onClose,
    hasOnChangeCallback,
    onChange,
    onInput,
    onKeyDown,
    value = '',
    title,
    name,
    id,
    specifiedLanguage,
    inputProps,
    disabled,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
    onRealtimeChange,
    afterContent,
    codeMirrorExtensions,
    showCharacterCounter = false,
  } = props;

  const { maxLength } = inputProps || {};

  const [currentValue, setCurrentValue] = useState(value);
  const currentValueRef = useRef(value);
  const editorRef = useRef();
  const suppressRealtimeRef = useRef(false);

  useEffect(() => {
    if (open) {
      setCurrentValue(value);
      currentValueRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onNotifyChange = useCallback(
    newValue => {
      currentValueRef.current = newValue;
      setCurrentValue(newValue);
      if (suppressRealtimeRef.current) {
        suppressRealtimeRef.current = false;
        return;
      }
      onRealtimeChange?.(newValue);
    },
    [onRealtimeChange],
  );

  const handleBlur = useCallback(() => {
    const event = {
      preventDefault: () => {},
      target: {
        value: currentValueRef.current,
        name,
        id,
      },
    };
    hasOnChangeCallback ? onChange?.(event) : onInput?.(event);
  }, [hasOnChangeCallback, id, name, onChange, onInput]);

  const { extensions: linterExtensions } = useLanguageLinter(specifiedLanguage, editorRef.current?.view);
  const extensions = [...(linterExtensions || []), ...(codeMirrorExtensions || [])];

  const onClickClose = useCallback(() => {
    handleBlur();
    onClose?.();
  }, [handleBlur, onClose]);

  const handleReplaceRange = useCallback((start, end, replacement) => {
    const view = editorRef.current?.view;
    if (!view) return;
    suppressRealtimeRef.current = true;
    try {
      const cursorPos = start + replacement.length;
      view.dispatch({
        changes: { from: start, to: end, insert: replacement },
        selection: { anchor: cursorPos },
      });
      const newValue = view.state.doc.toString();
      currentValueRef.current = newValue;
      setCurrentValue(newValue);
    } catch {
      suppressRealtimeRef.current = false;
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getCurrentValue: () => editorRef.current?.view?.state?.doc?.toString() ?? currentValueRef.current,
    getCursorPosition: () => editorRef.current?.view?.state?.selection?.main?.head ?? null,
    replaceRange: handleReplaceRange,
  }));

  return (
    <Modal.StyledInputModalBase
      open={open}
      onClose={onClickClose}
      title={title}
      value={value}
      specifiedLanguage={specifiedLanguage}
    >
      <Box sx={styles.editorContainer}>
        <Box sx={styles.editorWrapper}>
          {maxLength && showCharacterCounter && (
            <Box sx={styles.limitWrapper}>
              <Text.CharacterCounter
                value={currentValue}
                maxLength={maxLength}
                textVariant="bodyMedium"
              />
            </Box>
          )}
          {enableFStringAutocomplete ? (
            <AIAssistantCodeMirrorInput
              readOnly={disabled}
              editorRef={editorRef}
              value={currentValue}
              extensions={extensions}
              notifyChange={onNotifyChange}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              enableFStringAutocomplete={enableFStringAutocomplete}
              stateVariableOptions={stateVariableOptions}
            />
          ) : (
            <Field.CodeMirrorEditor
              readOnly={disabled}
              ref={editorRef}
              value={currentValue}
              extensions={extensions}
              notifyChange={onNotifyChange}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              maxLength={maxLength}
            />
          )}
        </Box>
      </Box>
      {afterContent}
    </Modal.StyledInputModalBase>
  );
});

StyledInputModal.displayName = 'StyledInputModal';

export default memo(StyledInputModal);

/** @type {MuiSx} */
const styles = {
  editorContainer: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
  },
  editorWrapper: ({ palette }) => ({
    flex: 1,
    height: '100%',
    position: 'relative',
    '& .cm-editor': {
      backgroundColor: palette.background.default,
    },
    '& .cm-scroller': {
      backgroundColor: palette.background.default,
    },
    '& .cm-gutters': {
      backgroundColor: palette.background.tabPanel,
      borderRight: 'none',
    },
  }),
  limitWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5rem',
  },
};
