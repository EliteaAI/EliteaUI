import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { Input } from '@/[fsd]/shared/ui';

const EditCellInput = memo(props => {
  const {
    id,
    field,
    row: { isNew, type, ...otherValues },
    hasActionsToolBar,
    onChangeValue,
    maxLength,
    multiline,
  } = props;

  const oldValue = useMemo(() => {
    if (
      field === 'value' &&
      (type === FlowEditorConstants.StateVariableTypes.Json ||
        type === FlowEditorConstants.StateVariableTypes.List)
    ) {
      return otherValues[field] ? JSON.stringify(otherValues[field], null, 2) : '';
    }
    return otherValues[field] ?? '';
  }, [field, otherValues, type]);

  const [inputValue, setInputValue] = useState(oldValue);

  const onBlur = useCallback(() => {
    if (inputValue !== oldValue) {
      onChangeValue(inputValue, needRestore => {
        if (needRestore) {
          setInputValue(otherValues[field] ?? '');
        }
      });
    }
  }, [field, inputValue, oldValue, onChangeValue, otherValues]);

  const onBlurRef = useRef(onBlur);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  const onChange = useCallback(
    event => {
      const newValue = event.target.value; // The new value entered by the user
      setInputValue(maxLength ? newValue.slice(0, maxLength) : newValue);
      setTimeout(() => {
        onBlurRef.current?.();
      }, 30);
    },
    [maxLength],
  );

  const onKeyDown = useCallback(
    event => {
      const textarea = event.target;
      event.stopPropagation();
      if (event.key === 'Enter') {
        // Allow "Command + Enter" or "Ctrl + Enter" to insert a newline at the caret position
        event.preventDefault();
        event.stopPropagation();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        // Insert a newline at the caret position
        setInputValue(inputValue.slice(0, start) + '\n' + inputValue.slice(end));
        // Move the caret to the position after the newline
        setTimeout(() => {
          textarea.setSelectionRange?.(start + 1, start + 1);
        }, 0);
      }
    },
    [inputValue],
  );

  return (
    <Input.StyledInputEnhancer
      containerProps={{ width: '100%' }}
      autoComplete="off"
      id={`edit-secret-${id}`}
      focused={!isNew}
      autoFocus={!isNew}
      required
      fullWidth
      multiline={multiline}
      maxRows={15}
      onChange={onChange}
      onBlur={onBlur}
      enableAutoBlur={false}
      value={inputValue}
      hasActionsToolBar={hasActionsToolBar}
      showFullScreenAction
      showExpandAction
      fieldName="Default value"
      actionsBarProps={{
        sx: {
          top: '.125rem',
        },
      }}
      onKeyDown={onKeyDown}
      onInputModalClose={onBlur}
      language={
        type === FlowEditorConstants.StateVariableTypes.Json ||
        type === FlowEditorConstants.StateVariableTypes.List
          ? 'json'
          : 'text'
      }
    />
  );
});

EditCellInput.displayName = 'EditCellInput';

export default EditCellInput;
