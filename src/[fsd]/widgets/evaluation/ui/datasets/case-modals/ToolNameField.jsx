import { memo } from 'react';

import { Autocomplete, TextField } from '@mui/material';

import { filterToolOptions } from '../../../lib/helpers';

/** One tool name: free text with suggestions from the agent's toolkits. */
const ToolNameField = memo(props => {
  const { value, onValue, options = [], placeholder, testId } = props;
  const styles = toolNameFieldStyles();

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

/** @type {MuiSx} */
const toolNameFieldStyles = () => ({
  autocomplete: {
    flex: 1,
    minWidth: 0,
    '& .MuiOutlinedInput-root': {
      minHeight: '2.5rem',
    },
  },
  popper: {
    '& .MuiAutocomplete-option': {
      fontSize: '0.875rem',
    },
  },
  listbox: {
    maxHeight: '18rem',
  },
});

export default ToolNameField;
