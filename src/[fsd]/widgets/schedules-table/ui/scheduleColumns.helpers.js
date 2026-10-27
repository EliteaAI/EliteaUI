// All 8 columns show at every width (owner: no hidden columns). The tier comes from the measured table
// width: 796 px at a 1280 px window, 956 px at 1440, 1116 px at 1600.
// The regular tier starts at 948 px, a 1280 px window with the main sidebar collapsed (+152 px).
const REGULAR_MIN_PX = 948;
const COMFORTABLE_MIN_PX = 1116;
// Under the compact sum the header and rows scroll sideways together and the Actions column stays pinned
export const COMPACT_MIN_PX = 796;
export const TABLE_MIN_WIDTH = '49.75rem';
// The measured box also holds the 1.5 rem side gutters of GridTableContainer
export const GUTTERS_PX = 48;

// The text columns grow from their compact width; the other columns take the width of the tier
export const SCHEDULES_COLUMNS = [
  { field: 'name', label: 'Name & Description', width: 'minmax(10.25rem, 1.3fr)', sortable: true },
  { field: 'entity_name', label: 'Entity Name', width: 'minmax(7.5rem, 1fr)', sortable: true },
  { field: 'schedule', label: 'Schedule', width: 'minmax(7.25rem, 1fr)' },
  { field: 'next_run', label: 'Next run', sortable: true },
  { field: 'last_run', label: 'Last run', sortable: true },
  { field: 'owner', label: 'Owner' },
  { field: 'enabled', label: 'Enabled', sortable: true },
  { field: 'actions', label: 'Actions' },
];
export const TIER_WIDTHS = {
  compact: {
    next_run: '5.75rem',
    last_run: '5.75rem',
    owner: '3.5rem',
    enabled: '5.5rem',
    actions: '4.25rem',
  },
  // Last run takes the Next run width; the regular Owner gives 0.75 rem for it. 7.75 rem fits the
  // widest date ("Nov, 30 23:30") with the cell padding (live check at 1440 px)
  regular: {
    next_run: '7.75rem',
    last_run: '7.75rem',
    owner: '6.75rem',
    enabled: '5.5rem',
    actions: '4.25rem',
  },
  comfortable: {
    next_run: '9.25rem',
    last_run: '9.25rem',
    owner: '9.75rem',
    enabled: '6rem',
    actions: '6.5625rem',
  },
};
export const ROW_HEIGHT = '3.5rem';

export const getTier = tableWidth => {
  if (tableWidth >= COMFORTABLE_MIN_PX) return 'comfortable';
  if (tableWidth >= REGULAR_MIN_PX) return 'regular';
  return 'compact';
};
