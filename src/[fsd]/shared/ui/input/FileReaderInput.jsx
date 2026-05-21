import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

import YAML from 'js-yaml';

import { useTheme } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';
import { debounce, getFileFormat } from '@/common/utils';
import useToast from '@/hooks/useToast';

const FileReaderEnhancer = forwardRef(
  (
    { defaultValue, updateVariableList, onChange, hasActionsToolBar = true, fieldName = '', ...props },
    ref,
  ) => {
    const theme = useTheme();
    const [inputValue, setInputValue] = useState(defaultValue);
    const [highlightContext, setHighlightContext] = useState(false);
    const { toastError } = useToast();
    const textareaRef = useRef(null);
    const modalRef = useRef(null);

    const handleReplaceRange = useCallback(
      (start, end, replacement) => {
        const isModalOpen = !!modalRef.current;
        const current = isModalOpen
          ? (modalRef.current.getCurrentValue?.() ?? inputValue)
          : (textareaRef.current?.value ?? inputValue);
        const newValue = current.slice(0, start) + replacement + current.slice(end);
        setInputValue(newValue);
        updateVariableList(newValue);
        onChange(newValue);
        if (isModalOpen) {
          modalRef.current.replaceRange?.(start, end, replacement);
        } else {
          // Restore cursor position after React re-render.
          const cursorPos = start + replacement.length;
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(cursorPos, cursorPos);
              textareaRef.current.focus();
            }
          });
        }
      },
      [inputValue, onChange, updateVariableList],
    );

    useImperativeHandle(ref, () => ({
      restoreValue: (valueToRestore = '') => setInputValue(valueToRestore),
      getInputContent: () => {
        if (modalRef.current) return modalRef.current.getCurrentValue?.() ?? inputValue;
        return textareaRef.current?.value ?? inputValue;
      },
      getCursorPosition: () => {
        if (modalRef.current) return modalRef.current.getCursorPosition?.() ?? null;
        return textareaRef.current?.selectionStart ?? null;
      },
      getTextareaElement: () => textareaRef.current,
      replaceRange: handleReplaceRange,
    }));

    const debouncedUpdateVariableList = useMemo(
      () => debounce(value => updateVariableList(value), 500),
      [updateVariableList],
    );

    const handleInput = useCallback(
      event => {
        event.preventDefault();
        const value = event.target.value;
        setInputValue(value);
        onChange(value);
        debouncedUpdateVariableList(value);
      },
      [onChange, debouncedUpdateVariableList],
    );

    const handleDragOver = useCallback(() => {
      event => event.preventDefault();
      if (highlightContext) return;
      setHighlightContext(true);
    }, [highlightContext]);

    const handleBlur = useCallback(() => {
      event => event.preventDefault();
    }, []);

    const handleDragLeave = useCallback(() => {
      event => event.preventDefault();
      setHighlightContext(false);
    }, []);

    const handleDrop = useCallback(
      event => {
        event.preventDefault();
        setHighlightContext(false);
        const file = event.dataTransfer.files[0];
        const fileName = file?.name;
        const reader = new FileReader();
        if (file) {
          reader.readAsText(file);
        }
        reader.onload = () => {
          try {
            let fileData = null;
            const fileFormat = getFileFormat(fileName);
            const dataString = reader.result;
            if (fileFormat === 'yaml') {
              const yamlData = YAML.load(dataString);
              fileData = { context: JSON.stringify(yamlData) };
            } else {
              fileData = { context: dataString };
            }
            const { context } = fileData;
            setInputValue(context);
            onChange(context);
            updateVariableList(context);
          } catch {
            toastError('Error parsing File: Unsupported format');
          }
        };
      },
      [onChange, toastError, updateVariableList],
    );

    return (
      <Input.StyledInputEnhancer
        maxRows={15}
        value={inputValue}
        style={getStyle({ theme, highlightContext })}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onInput={handleInput}
        onBlur={handleBlur}
        hasActionsToolBar={hasActionsToolBar}
        fieldName={fieldName}
        inputRef={textareaRef}
        innerModalRef={modalRef}
        {...props}
      />
    );
  },
);

FileReaderEnhancer.displayName = 'FileReaderEnhancer';

const getStyle = ({ theme, highlightContext }) => ({
  backgroundColor: highlightContext ? theme.palette.text.contextHighLight : '',
});

export default FileReaderEnhancer;
