import { createFilterOptions } from '@mui/material';

// Shared by ToolNameField and ToolNamesChipsField. Same picker as the admin Guardrails tool fields:
// a filtered dropdown of known tools that still takes free text, because MCP and similar toolkits
// list no tools up front.
const filter = createFilterOptions();
const MAX_DROPDOWN_OPTIONS = 50;

export const filterToolOptions = (options, state) => filter(options, state).slice(0, MAX_DROPDOWN_OPTIONS);

/** @type {MuiSx} */
export const toolPickerStyles = () => ({
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
