import { createFilterOptions } from '@mui/material';

// Same picker as the admin Guardrails tool fields: a filtered dropdown of known tools that still takes
// free text, because MCP and similar toolkits list no tools up front.
const filter = createFilterOptions();
const MAX_DROPDOWN_OPTIONS = 50;

export const filterToolOptions = (options, state) => filter(options, state).slice(0, MAX_DROPDOWN_OPTIONS);
