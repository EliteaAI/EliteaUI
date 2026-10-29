// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import SchedulesPage from '../SchedulesPage';

const mocks = vi.hoisted(() => ({
  useGetScheduleListQuery: vi.fn(),
  useSelectedProjectId: vi.fn(),
  toastError: vi.fn(),
  checkPermission: vi.fn(),
  navigate: vi.fn(),
  searchParams: new URLSearchParams(),
  setSearchParams: vi.fn(),
  locationState: null,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ state: mocks.locationState }),
  useSearchParams: () => [mocks.searchParams, mocks.setSearchParams],
}));

vi.mock('@/[fsd]/entities/schedule', () => ({ useGetScheduleListQuery: mocks.useGetScheduleListQuery }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: mocks.useSelectedProjectId,
  useToast: () => ({ toastError: mocks.toastError }),
  useShouldCollapseRightToolbar: () => ({ shouldCollapseRightToolbar: false }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: mocks.checkPermission }),
}));
vi.mock('@/[fsd]/features/schedule-import-export', () => ({
  ScheduleImportExportActions: ({ projectId }) => <div data-testid="import-export-actions">{projectId}</div>,
}));
vi.mock('@/[fsd]/features/settings', () => ({
  DrawerPage: ({ children }) => <div>{children}</div>,
  DrawerPageBody: ({ children }) => <div>{children}</div>,
  DrawerPageHeader: ({ title, titleTestId, showAddButton, extraContent, slotProps }) => (
    <div>
      <span data-testid={titleTestId}>{title}</span>
      {extraContent}
      {showAddButton && (
        <button
          data-testid={slotProps.addButton.testId}
          onClick={slotProps.addButton.onAdd}
        >
          {slotProps.addButton.tooltip}
        </button>
      )}
    </div>
  ),
}));
vi.mock('@/[fsd]/widgets/schedules-table', () => ({
  SchedulesFilters: ({ value, onChange, onClear, hasFilters, isAdmin, hideEntityType }) => (
    <div
      data-testid="filters"
      data-admin={String(isAdmin)}
      data-has-filters={String(hasFilters)}
      data-hide-entity-type={String(Boolean(hideEntityType))}
    >
      <button onClick={() => onChange({ ...value, search: 'nightly' })}>search</button>
      <button onClick={() => onChange({ ...value, status: 'failed' })}>status</button>
      <button onClick={() => onChange({ ...value, ownerIds: [3, 4] })}>owners</button>
      <button onClick={() => onChange({ ...value, status: '', search: '' })}>clear</button>
      <button onClick={onClear}>clear all</button>
    </div>
  ),
  SchedulesTable: ({
    toolbar,
    emptyMessage,
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onChangePageSize,
    isLoading,
    sortConfig,
    onSort,
  }) => (
    <div>
      {toolbar}
      <span data-testid="empty-message">{emptyMessage}</span>
      <span data-testid="sort">{`${sortConfig.field} ${sortConfig.direction}`}</span>
      <button onClick={() => onSort('name')}>sort name</button>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="rows">{rows.map(row => row.name).join(',')}</span>
      <span data-testid="total">{total}</span>
      <span data-testid="page">{page}</span>
      <span data-testid="page-size">{pageSize}</span>
      <button onClick={() => onPageChange(page + 1)}>next</button>
      <button onClick={() => onChangePageSize(50)}>size</button>
    </div>
  ),
}));

const lastArgs = () => mocks.useGetScheduleListQuery.mock.calls.at(-1)[0];

const listAnswer = status => ({
  currentData: { total: 1, rows: [{ id: 1, name: 'Nightly', last_run_status: status }] },
  isError: false,
});

describe('SchedulesPage', () => {
  beforeEach(() => {
    mocks.useSelectedProjectId.mockReturnValue(5);
    mocks.checkPermission.mockReturnValue(false);
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: { total: 45, rows: [{ id: 1, name: 'Nightly' }] },
      isError: false,
    });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.locationState = null;
  });

  it('requests the first page of the current project', () => {
    render(<SchedulesPage />);
    expect(lastArgs()).toMatchObject({ projectId: 5, page: 0, pageSize: 20 });
    expect(screen.getByTestId('total')).toHaveTextContent('45');
  });

  it('skips the request without a project', () => {
    mocks.useSelectedProjectId.mockReturnValue(undefined);
    render(<SchedulesPage />);
    expect(mocks.useGetScheduleListQuery.mock.calls.at(-1)[1]).toMatchObject({ skip: true });
  });

  it('returns to the first page when the project changes', () => {
    const { rerender } = render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    expect(lastArgs()).toMatchObject({ projectId: 5, page: 1 });
    mocks.useSelectedProjectId.mockReturnValue(7);
    rerender(<SchedulesPage tick={1} />);
    expect(screen.getByTestId('page')).toHaveTextContent('0');
    expect(lastArgs()).toMatchObject({ projectId: 7, page: 0 });
  });

  it('returns to the first page when the page size changes', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('size'));
    expect(lastArgs()).toMatchObject({ page: 0, pageSize: 50 });
  });

  it('shows the server message in the error toast and no rows', () => {
    mocks.useGetScheduleListQuery.mockReturnValue({
      isError: true,
      error: { status: 500, data: { error: 'boom' } },
    });
    render(<SchedulesPage />);
    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(screen.getByTestId('rows')).toHaveTextContent('');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('shows the rows of the API', () => {
    render(<SchedulesPage />);
    expect(screen.getByTestId('rows')).toHaveTextContent('Nightly');
  });

  it('shows no rows of another project while the new project loads', () => {
    mocks.useSelectedProjectId.mockReturnValue(5);
    mocks.useGetScheduleListQuery.mockReturnValue({
      data: { total: 45, rows: [{ id: 1, name: 'Old project row' }] },
      currentData: undefined,
      isError: false,
    });
    render(<SchedulesPage />);
    expect(screen.getByTestId('rows').textContent).toBe('');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  it('shows the loading state, not "No schedules", until the first answer', () => {
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: undefined,
      isFetching: true,
      isError: false,
    });
    render(<SchedulesPage />);
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('keeps the rows on screen while the same page refreshes', () => {
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: { total: 1, rows: [{ id: 1, name: 'Nightly' }] },
      isFetching: true,
      isError: false,
    });
    render(<SchedulesPage />);
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('sorts by the next run first, like the API default', () => {
    render(<SchedulesPage />);
    expect(lastArgs()).toMatchObject({ sortBy: 'next_run', sortOrder: 'asc' });
  });

  it('a header click toggles the direction and returns to the first page', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('sort name'));
    expect(lastArgs()).toMatchObject({ page: 0, sortBy: 'name', sortOrder: 'asc' });
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('sort name'));
    expect(lastArgs()).toMatchObject({ page: 0, sortBy: 'name', sortOrder: 'desc' });
    expect(screen.getByTestId('sort')).toHaveTextContent('name desc');
  });

  it('shows the round + button with the create permission and opens New schedule', () => {
    mocks.checkPermission.mockImplementation(
      permission => permission === 'models.applications.schedules.create',
    );
    render(<SchedulesPage />);
    fireEvent.click(screen.getByTestId('schedules-add-button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules/create');
  });

  it('hides the + button without the create permission', () => {
    render(<SchedulesPage />);
    expect(screen.queryByTestId('schedules-add-button')).toBeNull();
  });

  it('shows the page title in the Settings header', () => {
    render(<SchedulesPage />);
    expect(screen.getByTestId('schedules-page-header')).toHaveTextContent('Schedules');
  });

  it('a filter change sends the filter and returns to the first page', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('status'));
    expect(lastArgs()).toMatchObject({ page: 0, status: 'failed' });
  });

  it('a search change returns to the first page', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('search'));
    expect(lastArgs()).toMatchObject({ page: 0, search: 'nightly' });
  });

  it('passes the filtered empty message only while a filter or search is set', () => {
    render(<SchedulesPage />);
    expect(screen.getByTestId('empty-message')).toHaveTextContent(/^No schedules$/);
    fireEvent.click(screen.getByText('status'));
    expect(screen.getByTestId('empty-message')).toHaveTextContent('No schedules match the filters');
    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('empty-message')).toHaveTextContent(/^No schedules$/);
    fireEvent.click(screen.getByText('search'));
    expect(screen.getByTestId('empty-message')).toHaveTextContent('No schedules match the filters');
  });

  it('an admin sends the picked owner ids', () => {
    mocks.checkPermission.mockReturnValue(true);
    render(<SchedulesPage />);
    expect(screen.getByTestId('filters')).toHaveAttribute('data-admin', 'true');
    fireEvent.click(screen.getByText('owners'));
    expect(lastArgs()).toMatchObject({ ownerIds: [3, 4], page: 0 });
  });

  it('a user without the admin permission sends no owner ids', () => {
    render(<SchedulesPage />);
    expect(screen.getByTestId('filters')).toHaveAttribute('data-admin', 'false');
    fireEvent.click(screen.getByText('owners'));
    expect(lastArgs().ownerIds).toBeUndefined();
  });

  it('a project change clears the filters of the old project', () => {
    mocks.checkPermission.mockReturnValue(true);
    const { rerender } = render(<SchedulesPage />);
    fireEvent.click(screen.getByText('status'));
    fireEvent.click(screen.getByText('owners'));
    mocks.useSelectedProjectId.mockReturnValue(7);
    rerender(<SchedulesPage tick={2} />);
    expect(lastArgs()).toMatchObject({ projectId: 7, page: 0, status: '', ownerIds: [] });
  });

  it('"Clear filters" drops every filter and returns to the first page', () => {
    mocks.checkPermission.mockReturnValue(true);
    render(<SchedulesPage />);
    expect(screen.getByTestId('filters')).toHaveAttribute('data-has-filters', 'false');
    fireEvent.click(screen.getByText('status'));
    fireEvent.click(screen.getByText('owners'));
    fireEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('filters')).toHaveAttribute('data-has-filters', 'true');
    fireEvent.click(screen.getByText('clear all'));
    expect(lastArgs()).toMatchObject({
      page: 0,
      entityType: '',
      status: '',
      enabled: '',
      search: '',
      ownerIds: [],
    });
    expect(screen.getByTestId('filters')).toHaveAttribute('data-has-filters', 'false');
  });

  it('polls every 10 seconds while a row runs and stops after', () => {
    mocks.useGetScheduleListQuery.mockReturnValue(listAnswer('running'));
    const { rerender } = render(<SchedulesPage />);
    expect(mocks.useGetScheduleListQuery.mock.calls.at(-1)[1]).toMatchObject({ pollingInterval: 10000 });
    mocks.useGetScheduleListQuery.mockReturnValue(listAnswer('success'));
    rerender(<SchedulesPage tick={3} />);
    expect(mocks.useGetScheduleListQuery.mock.calls.at(-1)[1]).toMatchObject({ pollingInterval: 0 });
  });

  it('polls after Run now shows Running and stops when the run waits for approval', () => {
    mocks.useGetScheduleListQuery.mockReturnValue(listAnswer('running'));
    const { rerender } = render(<SchedulesPage />);
    expect(mocks.useGetScheduleListQuery.mock.calls.at(-1)[1]).toMatchObject({ pollingInterval: 10000 });
    mocks.useGetScheduleListQuery.mockReturnValue(listAnswer('waiting_for_approval'));
    rerender(<SchedulesPage tick={4} />);
    expect(mocks.useGetScheduleListQuery.mock.calls.at(-1)[1]).toMatchObject({ pollingInterval: 0 });
  });

  it('steps back to the last page with rows when the current page is empty', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('page')).toHaveTextContent('1');
    mocks.useGetScheduleListQuery.mockReturnValue({ currentData: { total: 20, rows: [] }, isError: false });
    fireEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('page')).toHaveTextContent('0');
  });

  it('steps back one page when the current page is empty and the answer has no total', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    mocks.useGetScheduleListQuery.mockReturnValue({ currentData: { rows: [] }, isError: false });
    fireEvent.click(screen.getByText('next'));
    expect(screen.getByTestId('page')).toHaveTextContent('0');
  });

  it('the page header carries the import and export actions of the project', () => {
    render(<SchedulesPage />);
    expect(screen.getByTestId('import-export-actions')).toHaveTextContent('5');
  });

  it('TC-US35-18 lists only the entity of the URL and shows it as a chip with its name', () => {
    mocks.searchParams = new URLSearchParams('entityType=agent&entityId=12');
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: { total: 1, rows: [{ id: 1, name: 'Nightly', entity_name: 'Digest bot' }] },
      isError: false,
    });
    render(<SchedulesPage />);

    expect(lastArgs()).toMatchObject({ entityType: 'agent', entityId: '12', page: 0 });
    expect(screen.getByTestId('schedules-entity-chip')).toHaveTextContent('Agent: Digest bot');
  });

  it('TC-US35-18 removing the chip drops entityType and entityId from the URL', () => {
    mocks.searchParams = new URLSearchParams('entityType=pipeline&entityId=9&tab=x');
    render(<SchedulesPage />);
    expect(screen.getByTestId('schedules-entity-chip')).toHaveTextContent('Pipeline: 9');

    fireEvent.click(within(screen.getByTestId('schedules-entity-chip')).getByTestId('CancelIcon'));

    const [update] = mocks.setSearchParams.mock.calls.at(-1);
    expect(update(new URLSearchParams('entityType=pipeline&entityId=9&tab=x')).toString()).toBe('tab=x');
  });

  it('without the URL entity the page shows no chip and sends no entity id', () => {
    render(<SchedulesPage />);

    expect(lastArgs().entityId).toBeUndefined();
    expect(screen.queryByTestId('schedules-entity-chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('filters')).toHaveAttribute('data-hide-entity-type', 'false');
  });

  it('TC-US35-18 names the entity from the editor link when the list has no rows', () => {
    mocks.searchParams = new URLSearchParams('entityType=agent&entityId=12');
    mocks.locationState = { entityName: 'Digest bot' };
    mocks.useGetScheduleListQuery.mockReturnValue({ currentData: { total: 0, rows: [] }, isError: false });
    render(<SchedulesPage />);

    expect(screen.getByTestId('schedules-entity-chip')).toHaveTextContent('Agent: Digest bot');
  });

  it('TC-US35-18 hides the Type filter while the entity chip shows', () => {
    mocks.searchParams = new URLSearchParams('entityType=agent&entityId=12');
    render(<SchedulesPage />);

    expect(screen.getByTestId('filters')).toHaveAttribute('data-hide-entity-type', 'true');
  });

  it('TC-US35-18 a project switch drops entityType and entityId from the URL', () => {
    mocks.searchParams = new URLSearchParams('entityType=agent&entityId=12&tab=x');
    mocks.useSelectedProjectId.mockReturnValue(undefined);
    const { rerender } = render(<SchedulesPage />);
    mocks.useSelectedProjectId.mockReturnValue(5);
    rerender(<SchedulesPage tick={5} />);
    expect(mocks.setSearchParams).not.toHaveBeenCalled();

    mocks.useSelectedProjectId.mockReturnValue(7);
    rerender(<SchedulesPage tick={6} />);

    const [update] = mocks.setSearchParams.mock.calls.at(-1);
    expect(update(new URLSearchParams('entityType=agent&entityId=12&tab=x')).toString()).toBe('tab=x');
  });
});
