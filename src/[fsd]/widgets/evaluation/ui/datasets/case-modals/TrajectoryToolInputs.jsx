import { memo, useCallback, useMemo, useState } from 'react';

import { Autocomplete, Box, Chip, TextField, createFilterOptions } from '@mui/material';

// Same picker as the admin Guardrails tool fields: a filtered dropdown of known tools that still
// takes free text, because MCP and similar toolkits list no tools up front.
const filter = createFilterOptions();
const MAX_DROPDOWN_OPTIONS = 50;
const filterOptions = (options, state) => filter(options, state).slice(0, MAX_DROPDOWN_OPTIONS);

const splitNames = text =>
  String(text ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const uniqueNames = names => [...new Set(names)];

/** One tool name: free text with suggestions from the agent's toolkits. */
export const ToolNameField = memo(props => {
  const { value, onValue, options = [], placeholder, testId } = props;
  const styles = trajectoryToolInputsStyles();

  return (
    <Autocomplete
      freeSolo
      fullWidth
      size="small"
      options={options}
      filterOptions={filterOptions}
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

/**
 * A list of tool names as chips. The form keeps the list as comma-separated text, so the value is
 * split on the way in and joined on the way out; a typed name is committed on Enter, comma or blur.
 */
export const ToolNamesChipsField = memo(props => {
  const { text, onText, options = [], placeholder, testId } = props;
  const styles = trajectoryToolInputsStyles();
  const [inputValue, setInputValue] = useState('');

  const names = useMemo(() => splitNames(text), [text]);
  const available = useMemo(() => options.filter(name => !names.includes(name)), [options, names]);

  const commit = useCallback(next => onText(uniqueNames(next).join(', ')), [onText]);

  const handleInputChange = useCallback(
    (_, next) => {
      const typed = next ?? '';
      if (typed.includes(',')) {
        commit([...names, ...splitNames(typed)]);
        setInputValue('');
        return;
      }
      setInputValue(typed);
    },
    [commit, names],
  );

  const handleBlur = useCallback(() => {
    const typed = inputValue.trim();
    if (typed) commit([...names, typed]);
    setInputValue('');
  }, [commit, inputValue, names]);

  const handleDelete = useCallback(name => commit(names.filter(item => item !== name)), [commit, names]);

  return (
    <Box>
      <Autocomplete
        freeSolo
        multiple
        fullWidth
        size="small"
        options={available}
        filterOptions={filterOptions}
        value={names}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={(_, next) => commit(next.map(item => String(item).trim()).filter(Boolean))}
        onBlur={handleBlur}
        renderValue={() => null}
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
      {names.length > 0 && (
        <Box sx={styles.chips}>
          {names.map(name => (
            <Chip
              key={name}
              label={name}
              size="small"
              onDelete={() => handleDelete(name)}
              sx={styles.chip}
              data-testid={`${testId}-chip-${name}`}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

ToolNamesChipsField.displayName = 'ToolNamesChipsField';

/** @type {MuiSx} */
const trajectoryToolInputsStyles = () => ({
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
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    marginTop: '0.5rem',
  },
  chip: {
    fontSize: '0.75rem',
  },
});
