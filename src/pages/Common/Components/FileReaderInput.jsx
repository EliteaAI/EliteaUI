import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import YAML from 'js-yaml';

import { Input } from '@/[fsd]/shared/ui';
import { debounce, getFileFormat } from '@/common/utils';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const FileReaderEnhancer = forwardRef(
  (
    { defaultValue, updateVariableList, onChange, hasActionsToolBar = true, fieldName = '', ...props },
    ref,
  ) => {
    const theme = useTheme();
    const [inputValue, setInputValue] = useState(defaultValue);
    const [highlightContext, setHighlightContext] = useState(false);
    const { toastError } = useToast();

    useImperativeHandle(ref, () => ({
      restoreValue: (valueToRestore = '') => setInputValue(valueToRestore),
    }));

    const handleInput = useCallback(
      event => {
        event.preventDefault();
        setInputValue(event.target.value);
        debounce(() => {
          updateVariableList(event.target.value);
          onChange(event.target.value);
        }, 500)();
      },
      [onChange, updateVariableList],
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
      <>
        <Input.StyledInputEnhancer
          maxRows={15}
          value={inputValue}
          style={{ backgroundColor: highlightContext ? theme.palette.text.contextHighLight : '' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onInput={handleInput}
          onBlur={handleBlur}
          hasActionsToolBar={hasActionsToolBar}
          fieldName={fieldName}
          {...props}
        />
      </>
    );
  },
);

FileReaderEnhancer.displayName = 'FileReaderEnhancer';
export default FileReaderEnhancer;
