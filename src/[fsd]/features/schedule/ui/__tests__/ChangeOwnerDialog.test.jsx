// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ChangeOwnerDialog from '../ChangeOwnerDialog';

// Change owner dialog. The user dropdown is a plain stub.

const SCHEDULE = { id: 7, name: 'Nightly digest', owner: { id: 1, name: 'Ann Lee' } };
const USERS = [
  { id: 1, name: 'Ann Lee' },
  { id: 2, name: 'Bob Roy' },
];

const mocks = vi.hoisted(() => ({
  trigger: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  onLoadMoreUsers: vi.fn(),
  useUserList: vi.fn(),
  mutationState: { isLoading: false },
}));
let selectProps;

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
  useUserList: mocks.useUserList,
}));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useChangeScheduleOwnerMutation: () => [mocks.trigger, mocks.mutationState],
}));
vi.mock('@/[fsd]/shared/ui/select/LazySelect', () => ({
  default: props => {
    selectProps = props;
    return <div data-testid="owner-select">{props.label}</div>;
  },
}));

const theme = createTheme(getDesignTokens('light'));

const renderDialog = (props = {}) => {
  const onClose = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ChangeOwnerDialog
        open
        schedule={SCHEDULE}
        onClose={onClose}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onClose };
};

const pick = id => act(() => selectProps.onValueChange(id));
const confirm = () => screen.getByRole('button', { name: /confirm/i });
const succeed = () => mocks.trigger.mockReturnValue({ unwrap: () => Promise.resolve({}) });
const fail = error => mocks.trigger.mockReturnValue({ unwrap: () => Promise.reject(error) });

describe('ChangeOwnerDialog', () => {
  beforeEach(() => {
    mocks.mutationState.isLoading = false;
    mocks.useUserList.mockReturnValue({
      onLoadMoreUsers: mocks.onLoadMoreUsers,
      data: { rows: USERS, total: 45 },
      isUsersFetching: false,
    });
    succeed();
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the schedule name, the current owner and a user dropdown', () => {
    renderDialog();
    expect(screen.getByText(/Nightly digest/)).toBeInTheDocument();
    expect(screen.getByText(/Ann Lee/)).toBeInTheDocument();
    expect(screen.getByTestId('owner-select')).toBeInTheDocument();
    expect(selectProps.options.map(o => o.label)).toEqual(['Ann Lee', 'Bob Roy']);
  });

  it('searches users on the server', () => {
    renderDialog();
    act(() => selectProps.onSearch('bo'));
    expect(mocks.useUserList.mock.calls.at(-1)[0].query).toBe('bo');
  });

  it('loads the next page of users at the end of the list', () => {
    renderDialog();
    expect(selectProps.total).toBe(45);
    act(() => selectProps.onLoadMore());
    expect(mocks.onLoadMoreUsers).toHaveBeenCalledTimes(1);
  });

  it('keeps Confirm disabled while no user is picked', () => {
    renderDialog();
    expect(confirm()).toBeDisabled();
  });

  it('keeps Confirm disabled while the pick equals the current owner', () => {
    renderDialog();
    pick(1);
    expect(confirm()).toBeDisabled();
  });

  it('enables Confirm for a different owner', () => {
    renderDialog();
    pick(2);
    expect(confirm()).toBeEnabled();
  });

  it('sends the picked owner_id of the schedule', async () => {
    renderDialog();
    pick(2);
    fireEvent.click(confirm());
    await waitFor(() => expect(mocks.trigger).toHaveBeenCalledTimes(1));
    expect(mocks.trigger).toHaveBeenCalledWith({ projectId: 5, scheduleId: 7, ownerId: 2 });
  });

  it('closes the dialog and shows a success toast', async () => {
    const { onClose } = renderDialog();
    pick(2);
    fireEvent.click(confirm());
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and shows the server reason on 400', async () => {
    fail({ status: 400, data: { message: 'User is suspended' } });
    const { onClose } = renderDialog();
    pick(2);
    fireEvent.click(confirm());
    expect(await screen.findByText('User is suspended')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and shows the server reason on 503', async () => {
    fail({ status: 503, data: { message: 'Service unavailable' } });
    const { onClose } = renderDialog();
    pick(2);
    fireEvent.click(confirm());
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([403, 404])('closes the dialog and shows the error toast on %i', async status => {
    fail({ status, data: { message: 'Denied' } });
    const { onClose } = renderDialog();
    pick(2);
    fireEvent.click(confirm());
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
  });

  it('keeps Confirm disabled while the call runs', () => {
    mocks.mutationState.isLoading = true;
    renderDialog();
    pick(2);
    expect(confirm()).toBeDisabled();
  });

  it('sends one request on a double click', async () => {
    mocks.trigger.mockReturnValue({ unwrap: () => new Promise(() => {}) });
    renderDialog();
    pick(2);
    fireEvent.click(confirm());
    fireEvent.click(confirm());
    expect(mocks.trigger).toHaveBeenCalledTimes(1);
  });
});
