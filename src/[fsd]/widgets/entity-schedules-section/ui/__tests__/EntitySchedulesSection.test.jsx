// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import EntitySchedulesSection from '../EntitySchedulesSection';

// EL-7011 US-35 and US-36: the Schedules section of the agent and pipeline editors

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  entitySchedules: vi.fn(),
  permissions: [],
  cardProps: [],
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate,
}));
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useSelector: selector => selector({ user: { id: 3 } }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => mocks.permissions.includes(permission) }),
}));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useEntitySchedules: args => mocks.entitySchedules(args),
}));
vi.mock('../EntityScheduleCard', () => ({
  default: props => {
    mocks.cardProps.push(props);
    return (
      <button
        data-testid={`card-${props.row.id}`}
        onClick={() => props.onOpenForm(props.row.id)}
      >
        {props.row.name}
      </button>
    );
  },
}));

const { PERMISSIONS } = await import('@/common/constants');
const ALL_RIGHTS = [PERMISSIONS.schedules.list, PERMISSIONS.schedules.create];

const theme = createTheme(getDesignTokens('light'));

const listOf = (rows, extra = {}) => ({
  rows,
  total: rows.length,
  isError: false,
  isFetching: false,
  hasMore: false,
  loadMore: vi.fn(),
  refetch: vi.fn(),
  ...extra,
});

const renderSection = (props = {}, path = '/agents/my/12') =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/:kind/:tab/:agentId/*"
            element={
              <EntitySchedulesSection
                entityType="agent"
                entityId={12}
                {...props}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('EntitySchedulesSection EL-7011', () => {
  beforeEach(() => {
    mocks.permissions = ALL_RIGHTS;
    mocks.cardProps = [];
    mocks.entitySchedules.mockReturnValue(
      listOf([
        { id: 1, name: 'Daily digest' },
        { id: 2, name: 'Friday recap' },
      ]),
    );
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('agent editor (US-35)', () => {
    it('TC-US35-01 TC-US35-18 R1.1 R1.6 shows the header with "+ Schedule", the count and "Open all in Schedules"', () => {
      renderSection();

      expect(screen.getByText('Schedules')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-add')).toHaveTextContent('+ Schedule');
      expect(screen.getByText('2 schedules run this agent.')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-open-all')).toHaveAttribute(
        'href',
        '/settings/schedules?entityType=agent&entityId=12',
      );
    });

    it('TC-US35-04 R2.1 requests the schedules of this agent and shows one card per row', () => {
      renderSection();

      expect(mocks.entitySchedules).toHaveBeenLastCalledWith({
        entityType: 'agent',
        entityId: 12,
        skip: false,
      });
      expect(screen.getAllByTestId(/^card-/).map(card => card.textContent)).toEqual([
        'Daily digest',
        'Friday recap',
      ]);
      expect(mocks.cardProps[0]).toMatchObject({ entityType: 'agent', currentUserId: 3 });
    });

    it('TC-US35-19 R1.6 counts one schedule in the singular', () => {
      mocks.entitySchedules.mockReturnValue(listOf([{ id: 1, name: 'Daily digest' }]));
      renderSection();

      expect(screen.getByText('1 schedule runs this agent.')).toBeInTheDocument();
    });

    it('TC-US35-07 R2.5 shows "No schedules yet." with "+ Schedule" for an empty list', () => {
      mocks.entitySchedules.mockReturnValue(listOf([]));
      renderSection();

      expect(screen.getByText('No schedules yet.')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-add')).toBeInTheDocument();
      expect(screen.queryByTestId(/^card-/)).not.toBeInTheDocument();
    });

    it('R2.5 shows no empty state while the first page loads', () => {
      mocks.entitySchedules.mockReturnValue(listOf([], { isFetching: true }));
      renderSection();

      expect(screen.queryByText('No schedules yet.')).not.toBeInTheDocument();
    });

    it('TC-US35-06 R2.4 "Show more" loads the next cards', () => {
      const list = listOf([{ id: 1, name: 'Daily digest' }], { total: 25, hasMore: true });
      mocks.entitySchedules.mockReturnValue(list);
      renderSection();

      fireEvent.click(screen.getByRole('button', { name: 'Show more' }));

      expect(list.loadMore).toHaveBeenCalledTimes(1);
    });

    it('TC-US35-03 R1.5 shows the error text and a retry button that refetches', () => {
      const list = listOf([], { isError: true, error: { status: 500, data: { error: 'Server down' } } });
      mocks.entitySchedules.mockReturnValue(list);
      renderSection();

      expect(screen.getByText(/Server down/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(list.refetch).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('No schedules yet.')).not.toBeInTheDocument();
    });

    it('TC-US35-08 R3.1 "+ Schedule" opens the nested create form with the editor as the return target', () => {
      renderSection({}, '/agents/my/12/70');

      fireEvent.click(screen.getByTestId('agent-schedules-section-add'));

      expect(mocks.navigate).toHaveBeenCalledWith('/agents/my/12/schedules/create', {
        state: { returnTo: '/agents/my/12/70' },
      });
    });

    it('TC-US35-10 R3.2 a card opens the nested edit form with the editor as the return target', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('card-2'));

      expect(mocks.navigate).toHaveBeenCalledWith('/agents/my/12/schedules/2', {
        state: { returnTo: '/agents/my/12' },
      });
    });

    it('TC-US35-09 R3.4 hides "+ Schedule" without the create permission', () => {
      mocks.permissions = [PERMISSIONS.schedules.list];
      renderSection();

      expect(screen.getByText('2 schedules run this agent.')).toBeInTheDocument();
      expect(screen.queryByTestId('agent-schedules-section-add')).not.toBeInTheDocument();
    });

    it('TC-US35-14 R1.2 hides the section and sends no request without the list permission', () => {
      mocks.permissions = [];
      const { container } = renderSection();

      expect(container).toBeEmptyDOMElement();
      expect(mocks.entitySchedules).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
    });

    it('TC-US35-15 R1.2 hides the section on a 403 of the list', () => {
      mocks.entitySchedules.mockReturnValue(listOf([], { isError: true, error: { status: 403 } }));
      const { container } = renderSection();

      expect(container).toBeEmptyDOMElement();
    });

    it('TC-US35-13 R1.3 hides the section inside a chat', () => {
      const { container } = renderSection({ isChatView: true });

      expect(container).toBeEmptyDOMElement();
    });

    it('TC-US35-02 R1.4 hides the section for an unsaved agent', () => {
      const { container } = renderSection({ entityId: undefined });

      expect(container).toBeEmptyDOMElement();
    });
  });
});
