// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import EntitySchedulesSection from '../EntitySchedulesSection';

// and the Schedules section of the agent and pipeline editors

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
          <Route
            path="/settings/schedules"
            element={<LinkState />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

const LinkState = () => <span data-testid="link-state">{JSON.stringify(useLocation().state)}</span>;

describe('EntitySchedulesSection', () => {
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

  it('puts the anchor id of the Trigger hint on the section root', () => {
    renderSection();
    const anchor = document.getElementById('entity-schedules-section');
    expect(anchor).not.toBeNull();
    expect(anchor).toContainElement(screen.getByTestId('agent-schedules-section-header'));
  });

  describe('agent editor', () => {
    it('TC-US35-01 TC-US35-18 shows the header with "+ Schedule", the count and the "Manage Schedules" link without an icon', () => {
      renderSection();

      expect(screen.getByText('Schedules')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-add')).toHaveTextContent(/^Schedule$/);
      expect(screen.getByText('2 schedules run the base version')).toBeInTheDocument();
      const link = screen.getByTestId('agent-schedules-section-open-all');
      expect(link).toHaveTextContent(/^Manage Schedules$/);
      expect(link.querySelector('svg')).toBeNull();
      expect(link).toHaveAttribute('href', '/settings/schedules?entityType=agent&entityId=12');
      // the app link colour, not the brand colour
      expect(link).toHaveStyle({ color: theme.palette.text.link });
    });

    it('the add button is an iconLabel button with a plus icon', () => {
      renderSection();

      const add = screen.getByTestId('agent-schedules-section-add');
      expect(add).toHaveClass('MuiButton-iconLabel');
      expect(add).not.toHaveClass('MuiButton-elitea');
      expect(add.querySelector('.MuiButton-startIcon svg')).toBeInTheDocument();
    });

    it('shows two skeleton cards while the first page loads', () => {
      mocks.entitySchedules.mockReturnValue(listOf([], { isFetching: true }));
      renderSection();

      expect(screen.getAllByTestId('agent-schedules-section-skeleton')).toHaveLength(2);
    });

    it('shows no skeleton once rows are on screen', () => {
      mocks.entitySchedules.mockReturnValue(listOf([{ id: 1, name: 'Daily digest' }], { isFetching: true }));
      renderSection();

      expect(screen.queryByTestId('agent-schedules-section-skeleton')).not.toBeInTheDocument();
    });

    it('TC-US35-10 Open run history of a card opens the nested edit form on its Runs section', () => {
      renderSection({}, '/agents/my/12?viewMode=owner');

      act(() => mocks.cardProps.at(-1).onOpenRunHistory(2));

      expect(mocks.navigate).toHaveBeenCalledWith(
        { pathname: '/agents/my/12/schedules/2', hash: '#runs', search: '?viewMode=owner' },
        { state: { returnTo: '/agents/my/12?viewMode=owner' } },
      );
    });

    it('TC-US35-18 "Open all in Schedules" passes the agent name for the entity chip', () => {
      renderSection({ entityName: 'Digest bot' });

      fireEvent.click(screen.getByTestId('agent-schedules-section-open-all'));

      expect(screen.getByTestId('link-state')).toHaveTextContent('{"entityName":"Digest bot"}');
    });

    it('TC-US35-04 requests the schedules of this agent and shows one card per row', () => {
      renderSection();

      expect(mocks.entitySchedules).toHaveBeenLastCalledWith({
        entityType: 'agent',
        entityId: 12,
        versionId: undefined,
        skip: false,
      });
      expect(screen.getAllByTestId(/^card-/).map(card => card.textContent)).toEqual([
        'Daily digest',
        'Friday recap',
      ]);
      expect(mocks.cardProps[0]).toMatchObject({ entityType: 'agent', currentUserId: 3 });
    });

    it('TC-US35-19 counts one schedule in the singular', () => {
      mocks.entitySchedules.mockReturnValue(listOf([{ id: 1, name: 'Daily digest' }]));
      renderSection();

      expect(screen.getByText('1 schedule runs the base version')).toBeInTheDocument();
    });

    it('TC-US35-07 shows "No schedules run the base version yet." with "+ Schedule" for an empty list', () => {
      mocks.entitySchedules.mockReturnValue(listOf([]));
      renderSection();

      expect(screen.getByText('No schedules run the base version yet.')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-add')).toBeInTheDocument();
      expect(screen.queryByTestId(/^card-/)).not.toBeInTheDocument();
    });

    it('shows no empty state while the first page loads', () => {
      mocks.entitySchedules.mockReturnValue(listOf([], { isFetching: true }));
      renderSection();

      expect(screen.queryByText('No schedules run the base version yet.')).not.toBeInTheDocument();
    });

    it('TC-US35-06 "Show more" loads the next cards', () => {
      const list = listOf([{ id: 1, name: 'Daily digest' }], { total: 25, hasMore: true });
      mocks.entitySchedules.mockReturnValue(list);
      renderSection();

      fireEvent.click(screen.getByRole('button', { name: 'Show more' }));

      expect(list.loadMore).toHaveBeenCalledTimes(1);
    });

    it('TC-US35-03 shows the error text and a retry button that refetches', () => {
      const list = listOf([], { isError: true, error: { status: 500, data: { error: 'Server down' } } });
      mocks.entitySchedules.mockReturnValue(list);
      renderSection();

      expect(screen.getByText(/Server down/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(list.refetch).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('No schedules run the base version yet.')).not.toBeInTheDocument();
    });

    it('TC-US35-08 "+ Schedule" opens the nested create form with the editor as the return target', () => {
      renderSection({}, '/agents/my/12/70?viewMode=owner');

      fireEvent.click(screen.getByTestId('agent-schedules-section-add'));

      // The form URL keeps the editor search, so the agent crumb opens the editor in owner mode too
      expect(mocks.navigate).toHaveBeenCalledWith(
        { pathname: '/agents/my/12/schedules/create', search: '?viewMode=owner' },
        { state: { returnTo: '/agents/my/12/70?viewMode=owner' } },
      );
    });

    it('TC-US35-10 a card opens the nested edit form with the editor as the return target', () => {
      renderSection({}, '/agents/my/12?viewMode=owner');

      fireEvent.click(screen.getByTestId('card-2'));

      expect(mocks.navigate).toHaveBeenCalledWith(
        { pathname: '/agents/my/12/schedules/2', search: '?viewMode=owner' },
        { state: { returnTo: '/agents/my/12?viewMode=owner' } },
      );
    });

    it('TC-US35-09 hides "+ Schedule" without the create permission', () => {
      mocks.permissions = [PERMISSIONS.schedules.list];
      renderSection();

      expect(screen.getByText('2 schedules run the base version')).toBeInTheDocument();
      expect(screen.queryByTestId('agent-schedules-section-add')).not.toBeInTheDocument();
    });

    it('TC-US35-14 hides the section and sends no request without the list permission', () => {
      mocks.permissions = [];
      const { container } = renderSection();

      expect(container).toBeEmptyDOMElement();
      expect(mocks.entitySchedules).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
    });

    it('TC-US35-15 hides the section on a 403 of the list', () => {
      mocks.entitySchedules.mockReturnValue(listOf([], { isError: true, error: { status: 403 } }));
      const { container } = renderSection();

      expect(container).toBeEmptyDOMElement();
    });

    it('TC-US35-13 hides the section inside a chat', () => {
      const { container } = renderSection({ isChatView: true });

      expect(container).toBeEmptyDOMElement();
    });

    it('TC-US35-02 hides the section for an unsaved agent', () => {
      const { container } = renderSection({ entityId: undefined });

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('editor version', () => {
    it('requests the schedules of the editor version', () => {
      renderSection({ versionId: 71, versionName: 'v1.0.1' });

      expect(mocks.entitySchedules).toHaveBeenLastCalledWith({
        entityType: 'agent',
        entityId: 12,
        versionId: 71,
        skip: false,
      });
    });

    it('names the version "base" as the base version', () => {
      renderSection({ versionId: 70, versionName: 'base' });
      expect(screen.getByText('2 schedules run the base version')).toBeInTheDocument();
    });

    it('names the version in the count text', () => {
      renderSection({ versionId: 71, versionName: 'v1.0.1' });
      expect(screen.getByText('2 schedules run version v1.0.1')).toBeInTheDocument();

      cleanup();
      mocks.entitySchedules.mockReturnValue(listOf([{ id: 1, name: 'Daily digest' }]));
      renderSection({ versionId: 71, versionName: 'v1.0.1' });
      expect(screen.getByText('1 schedule runs version v1.0.1')).toBeInTheDocument();
    });

    it('names the version in the empty state and keeps the add button and link', () => {
      mocks.entitySchedules.mockReturnValue(listOf([]));
      renderSection({ versionId: 71, versionName: 'v1.0.1' });

      expect(screen.getByText('No schedules run version v1.0.1 yet.')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-add')).toBeInTheDocument();
      expect(screen.getByTestId('agent-schedules-section-open-all')).toBeInTheDocument();
    });

    it('"+ Schedule" passes the editor versionId in the form URL', () => {
      renderSection({ versionId: 71 }, '/agents/my/12?viewMode=owner');

      fireEvent.click(screen.getByTestId('agent-schedules-section-add'));

      expect(mocks.navigate).toHaveBeenCalledWith(
        { pathname: '/agents/my/12/schedules/create', search: '?viewMode=owner&versionId=71' },
        { state: { returnTo: '/agents/my/12?viewMode=owner' } },
      );
    });

    it('Edit passes the version of that schedule in the form URL', () => {
      mocks.entitySchedules.mockReturnValue(listOf([{ id: 2, name: 'Friday recap', version_id: 72 }]));
      renderSection({ versionId: 71 }, '/agents/my/12');

      fireEvent.click(screen.getByTestId('card-2'));

      expect(mocks.navigate).toHaveBeenCalledWith(
        { pathname: '/agents/my/12/schedules/2', search: '?versionId=72' },
        { state: { returnTo: '/agents/my/12' } },
      );
    });
  });

  describe('pipeline editor', () => {
    const renderPipeline = (props = {}) =>
      renderSection({ entityType: 'pipeline', entityId: 9, ...props }, '/pipelines/all/9?viewMode=owner');

    it('TC-US36-01 TC-US36-03 TC-US36-16 lists the schedules of this pipeline with the pipeline count text', () => {
      renderPipeline();

      expect(mocks.entitySchedules).toHaveBeenLastCalledWith({
        entityType: 'pipeline',
        entityId: 9,
        versionId: undefined,
        skip: false,
      });
      expect(screen.getByText('2 schedules run the base version')).toBeInTheDocument();
      expect(screen.getByTestId('pipeline-schedules-section-add')).toBeInTheDocument();
      expect(mocks.cardProps.map(card => card.entityType)).toEqual(['pipeline', 'pipeline']);
    });

    it('TC-US36-01 TC-US36-16 narrower than 30 rem: button and link on row 1, count wraps on row 2', () => {
      renderPipeline();

      const css = [...document.querySelectorAll('style')].map(style => style.textContent).join('');
      expect(css).toContain('container-type:inline-size');
      expect(css).toContain('@container (min-width: 30rem)');
      expect(css).not.toContain('26rem');
      expect(screen.getByTestId('pipeline-schedules-section-header')).toHaveStyle({ flexWrap: 'wrap' });
      expect(screen.getByTestId('pipeline-schedules-section-add')).toHaveStyle({ whiteSpace: 'nowrap' });
      // The link shares row 1 with the button; the count takes row 2 and wraps, never truncates
      expect(screen.getByTestId('pipeline-schedules-section-open-all')).not.toHaveStyle({
        flexBasis: '100%',
      });
      const count = screen.getByText('2 schedules run the base version');
      expect(count).toHaveStyle({ flexBasis: '100%', order: '1' });
      expect(count).not.toHaveStyle({ whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
    });

    it('TC-US36-17 shows the empty state of a pipeline without schedules', () => {
      mocks.entitySchedules.mockReturnValue(listOf([]));
      renderPipeline();

      expect(screen.getByText('No schedules run the base version yet.')).toBeInTheDocument();
      expect(screen.queryByText(/^\d+ schedules? runs? /)).not.toBeInTheDocument();
    });

    it('TC-US36-11 hides the section of a pipeline opened in a chat', () => {
      expect(renderPipeline({ isChatView: true }).container).toBeEmptyDOMElement();
    });

    it('TC-US36-12 hides the pipeline section without the list permission', () => {
      mocks.permissions = [PERMISSIONS.schedules.create];

      expect(renderPipeline().container).toBeEmptyDOMElement();
    });

    it('TC-US36-04 TC-US36-09 passes every row the server returns, a migrated one and another owner included, to a card', () => {
      const migrated = { id: 5, name: 'Legacy nightly', owner: { id: 8, name: 'Old Creator' } };
      mocks.entitySchedules.mockReturnValue(listOf([migrated]));
      renderPipeline();

      expect(mocks.cardProps).toHaveLength(1);
      expect(mocks.cardProps[0]).toMatchObject({ row: migrated, currentUserId: 3, entityType: 'pipeline' });
    });

    it('TC-US36-06 "+ Schedule" opens the create form nested in the pipeline', () => {
      renderPipeline();

      fireEvent.click(screen.getByTestId('pipeline-schedules-section-add'));

      expect(mocks.navigate).toHaveBeenCalledWith(
        { pathname: '/pipelines/all/9/schedules/create', search: '?viewMode=owner' },
        { state: { returnTo: '/pipelines/all/9?viewMode=owner' } },
      );
    });
  });
});
