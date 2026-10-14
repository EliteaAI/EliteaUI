import { memo } from 'react';

import { Autocomplete, TextField } from '@mui/material';

import { filterToolOptions, toolPickerStyles } from './toolPicker';

/** One tool name: free text with suggestions from the agent's toolkits. */
const ToolNameField = memo(props => {
  const { value, onValue, options = [], placeholder, testId } = props;
  const styles = toolPickerStyles();

  return (
    <Autocomplete
      freeSolo
      fullWidth
      size="small"
      options={options}
      filterOptions={filterToolOptions}
      value={value || null}
      inputValue={value}
      onInputChange={(_, next) => onValue(next ?? '')}
      onChange={(_, next) => onValue(next ?? '')}
      slotProps={{ popper: { sx: styles.popper }, listbox: { sx: styles.listbox } }}
      sx={styles.autocomplete}
      data-testid={testId}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={placeholder}
        />
      )}
    />
  );
});

ToolNameField.displayName = 'ToolNameField';

export default ToolNameField;
