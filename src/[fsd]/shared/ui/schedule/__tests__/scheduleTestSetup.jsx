// Shared stand-ins for the schedule tests; vi.mock factories reach them through an async import.
import { createTheme } from '@mui/material';

// Fixed-offset zones keep the expected conversion stable across DST and across CI machines.
export const BROWSER_TIMEZONE = 'UTC';
export const FOREIGN_TIMEZONE = 'Etc/GMT-3'; // three hours ahead of UTC

export const theme = createTheme({
  palette: {
    background: { surface: { interactive: { default: '#111' } }, error: '#311' },
    border: { tips: '#123', error: '#411' },
    text: { tips: '#abc', warningText: '#f00', error: '#f00' },
    icon: { fill: { tips: '#abc' } },
    secondary: { main: '#888' },
    alert: { info: { background: '#112', border: '#123', text: '#abc', icon: '#abc' } },
    components: { tips: { background: { main: '#112', secondary: '#113' } } },
  },
});

export const TabGroupButton = props => (
  <div data-testid={props['data-testid']}>
    {props.arrayBtn.map(item => (
      <button
        key={item.value}
        type="button"
        onClick={event => props.onChange(event, item.value)}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export const FormInput = props => (
  <input
    data-testid={props['data-testid']}
    value={props.value}
    onChange={props.onChange}
  />
);

export const Empty = () => null;

// Only the viewer's timezone is pinned; the conversion itself runs for real.
export const mockScheduleHelpers = async importOriginal => ({
  ...(await importOriginal()),
  getBrowserTimezone: () => BROWSER_TIMEZONE,
});
