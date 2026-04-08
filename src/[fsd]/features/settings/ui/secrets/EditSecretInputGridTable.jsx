import { memo, useCallback, useState } from 'react';

import { Input } from '@/[fsd]/shared/ui';

const EditSecretInputGridTable = memo(props => {
  const { id, field, value, row, setRows, setRowModesModel } = props;

  const [inputValue, setInputValue] = useState(value ?? '');

  const handleOnChange = useCallback(
    event => {
      const newValue = event.target.value;
      setInputValue(newValue);

      // Update the row data directly in the rows state
      setRows(prevRows => prevRows.map(r => (r.id === id ? { ...r, [field]: newValue } : r)));
    },
    [id, field, setRows],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // Allow Shift+Enter for multiline
          event.preventDefault();
          event.stopPropagation();

          const textarea = event.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue = inputValue.slice(0, start) + '\n' + inputValue.slice(end);

          setInputValue(newValue);

          // Update the row data
          setRows(prevRows => prevRows.map(r => (r.id === id ? { ...r, [field]: newValue } : r)));

          setTimeout(() => {
            textarea.setSelectionRange(start + 1, start + 1);
          }, 0);
        } else {
          // Enter without Shift - exit edit mode
          event.preventDefault();
          event.stopPropagation();

          // Switch to view mode
          setRowModesModel(prev => ({
            ...prev,
            [id]: { mode: 'view' },
          }));
        }
      }
    },
    [id, field, inputValue, setRows, setRowModesModel],
  );

  return (
    <Input.StyledInputEnhancer
      containerProps={{ width: '100%' }}
      autoComplete="off"
      id={`edit-secret-${id}`}
      focused={field === 'name' && row?.isNew ? true : !row?.isNew}
      autoFocus={field === 'name' && row?.isNew ? true : !row?.isNew}
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

EditSecretInputGridTable.displayName = 'EditSecretInputGridTable';

export default EditSecretInputGridTable;
