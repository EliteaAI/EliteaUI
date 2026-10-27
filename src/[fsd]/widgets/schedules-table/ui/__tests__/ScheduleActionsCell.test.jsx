// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';

import ScheduleActionsCell from '../ScheduleActionsCell';

// Edit in the row menu opens the Edit schedule subpage.

const navigate = vi.fn();
const menuProps = vi.fn();

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('@/[fsd]/features/schedule', () => ({
  useScheduleRowActions: () => ({ onRun: vi.fn() }),
  ScheduleRowActions: props => {
    menuProps(props);
    return null;
  },
}));

describe('ScheduleActionsCell', () => {
  afterEach(cleanup);

  it('onEdit opens the schedule subpage of the row', () => {
    render(<ScheduleActionsCell row={{ id: 64, name: 'Nightly' }} />);
    menuProps.mock.calls.at(-1)[0].onEdit();
    expect(navigate).toHaveBeenCalledWith('/settings/schedules/64');
  });

  it('Open run history opens the schedule subpage on its Runs section', () => {
    render(<ScheduleActionsCell row={{ id: 64, name: 'Nightly' }} />);
    menuProps.mock.calls.at(-1)[0].onOpenRunHistory();
    expect(navigate).toHaveBeenCalledWith({ pathname: '/settings/schedules/64', hash: '#runs' });
  });
});
