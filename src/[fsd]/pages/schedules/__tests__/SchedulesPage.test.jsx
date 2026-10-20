// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SchedulesPage from '../SchedulesPage';

const mocks = vi.hoisted(() => ({
  useGetScheduleListQuery: vi.fn(),
  useSelectedProjectId: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/entities/schedule', () => ({ useGetScheduleListQuery: mocks.useGetScheduleListQuery }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: mocks.useSelectedProjectId,
  useToast: () => ({ toastError: mocks.toastError }),
}));
vi.mock('../SchedulesTable', () => ({
  default: ({ rows, total, page, pageSize, onPageChange, onChangePageSize, isLoading }) => (
    <div>
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

describe('EL-7011 US-26 SchedulesPage', () => {
  beforeEach(() => {
    mocks.useSelectedProjectId.mockReturnValue(5);
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: { total: 45, rows: [{ id: 1, name: 'Nightly' }] },
      isError: false,
    });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R2.1 requests the first page of the current project', () => {
    render(<SchedulesPage />);
    expect(lastArgs()).toMatchObject({ projectId: 5, page: 0, pageSize: 20 });
    expect(screen.getByTestId('total')).toHaveTextContent('45');
  });

  it('R2.1 skips the request without a project', () => {
    mocks.useSelectedProjectId.mockReturnValue(undefined);
    render(<SchedulesPage />);
    expect(mocks.useGetScheduleListQuery.mock.calls.at(-1)[1]).toMatchObject({ skip: true });
  });

  it('R3.2 returns to the first page when the project changes', () => {
    const { rerender } = render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    expect(lastArgs()).toMatchObject({ projectId: 5, page: 1 });
    mocks.useSelectedProjectId.mockReturnValue(7);
    rerender(<SchedulesPage />);
    expect(screen.getByTestId('page')).toHaveTextContent('0');
    expect(lastArgs()).toMatchObject({ projectId: 7, page: 0 });
  });

  it('R3.2 returns to the first page when the page size changes', () => {
    render(<SchedulesPage />);
    fireEvent.click(screen.getByText('next'));
    fireEvent.click(screen.getByText('size'));
    expect(lastArgs()).toMatchObject({ page: 0, pageSize: 50 });
  });

  it('R3.3 shows the server message in the error toast and no rows', () => {
    mocks.useGetScheduleListQuery.mockReturnValue({
      isError: true,
      error: { status: 500, data: { error: 'boom' } },
    });
    render(<SchedulesPage />);
    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(screen.getByTestId('rows')).toHaveTextContent('');
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('R3.4 shows the rows of the API and adds no owner filter', () => {
    render(<SchedulesPage />);
    expect(screen.getByTestId('rows')).toHaveTextContent('Nightly');
    expect(Object.keys(lastArgs()).sort((a, b) => a.localeCompare(b))).toEqual([
      'page',
      'pageSize',
      'projectId',
    ]);
  });

  it('R3.4 shows no rows of another project while the new project loads', () => {
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

  it('R2.1 shows the loading state, not "No schedules", until the first answer', () => {
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: undefined,
      isFetching: true,
      isError: false,
    });
    render(<SchedulesPage />);
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('R2.1 keeps the rows on screen while the same page refreshes', () => {
    mocks.useGetScheduleListQuery.mockReturnValue({
      currentData: { total: 1, rows: [{ id: 1, name: 'Nightly' }] },
      isFetching: true,
      isError: false,
    });
    render(<SchedulesPage />);
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });
});
