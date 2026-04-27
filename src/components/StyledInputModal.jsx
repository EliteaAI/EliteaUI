import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';

import { Field, Modal } from '@/[fsd]/shared/ui';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';

const StyledInputModal = memo(props => {
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
  } = props;

  const { maxLength } = inputProps || {};

  const [currentValue, setCurrentValue] = useState(value);
  const editorRef = useRef();

  useEffect(() => {
    if (open) {
      setCurrentValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onNotifyChange = useCallback(
    newValue => {
      setCurrentValue(newValue);
    },
    [setCurrentValue],
  );

  const handleBlur = useCallback(() => {
    const event = {
      preventDefault: () => {},
      target: {
        value: currentValue,
        name,
        id,
      },
    };
    hasOnChangeCallback ? onChange?.(event) : onInput?.(event);
  }, [currentValue, hasOnChangeCallback, id, name, onChange, onInput]);

  const { extensions } = useLanguageLinter(specifiedLanguage, editorRef.current?.view);

  const onClickClose = useCallback(() => {
    handleBlur();
    onClose?.();
  }, [handleBlur, onClose]);

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
        </Box>
      </Box>
    </Modal.StyledInputModalBase>
  );
});

StyledInputModal.displayName = 'StyledInputModal';

export default StyledInputModal;

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
};
