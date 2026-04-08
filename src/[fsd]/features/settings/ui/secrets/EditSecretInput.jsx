import { memo, useCallback, useState } from 'react';

import { GridRowModes, useGridApiContext } from '@mui/x-data-grid';

import { Input } from '@/[fsd]/shared/ui';

const EditableSecretInput = memo(props => {
  const {
    id,
    field,
    row: { isNew, secretValue },
    rowModesModel,
    setRowModesModel,
  } = props;

  const [inputValue, setInputValue] = useState(isNew ? (secretValue ?? '') : '');
  const apiRef = useGridApiContext();

  const handleOnChange = useCallback(
    event => {
      const newValue = event.target.value;
      setInputValue(newValue);
      apiRef.current.setEditCellValue({ id, field, value: newValue });
    },
    [apiRef, field, id],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();

          const textarea = event.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue = inputValue.slice(0, start) + '\n' + inputValue.slice(end);

          setInputValue(newValue);
          apiRef.current.setEditCellValue({ id, field, value: newValue });

          setTimeout(() => {
            textarea.setSelectionRange(start + 1, start + 1);
          }, 0);
        } else {
          event.preventDefault();
          event.stopPropagation();
          setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
        }
      }
    },
    [apiRef, id, field, inputValue, rowModesModel, setRowModesModel],
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
      multiline
      maxRows={15}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      value={inputValue}
    />
  );
});

EditableSecretInput.displayName = 'EditableSecretInput';

export default EditableSecretInput;
