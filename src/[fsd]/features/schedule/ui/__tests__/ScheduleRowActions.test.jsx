// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRowActions from '../ScheduleRowActions';

// EL-7011 US-28: row action menu filtered by allowed_actions (R1.1 to R1.3, R4.1, R4.3).

vi.mock('../ChangeOwnerDialog', () => ({
  default: ({ open, schedule, onClose }) =>
    open ? (
      <button
        data-testid="change-owner-dialog"
        onClick={onClose}
      >
        {JSON.stringify(schedule)}
      </button>
    ) : null,
}));

vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));

const theme = createTheme(getDesignTokens('light'));

const renderMenu = (row, handlers = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRowActions
        row={{ id: 7, name: 'Nightly digest', enabled: true, ...row }}
        {...handlers}
      />
    </ThemeProvider>,
  );

const openMenu = () => fireEvent.click(screen.getByTestId('schedule-7-menu-button'));

describe('ScheduleRowActions (EL-7011 US-28)', () => {
  afterEach(cleanup);

  it('R1.1 shows only the actions the row allows', () => {
    renderMenu({ allowed_actions: ['run', 'pause'] });
    openMenu();
    expect(screen.getByText('Run now')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('R1.1 ignores server actions the menu does not offer', () => {
    renderMenu({ allowed_actions: ['edit', 'delete'] });
    openMenu();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('R1.1 EL-7011 shows Change owner only when change_owner is allowed', () => {
    renderMenu({ allowed_actions: ['run'] });
    openMenu();
    expect(screen.queryByText('Change owner')).not.toBeInTheDocument();
  });

  it('R1.2 EL-7011 Change owner opens the dialog with the row schedule and closes it', () => {
    renderMenu({ allowed_actions: ['change_owner'], owner: { id: 3, name: 'Ann' } });
    expect(screen.queryByTestId('change-owner-dialog')).not.toBeInTheDocument();
    openMenu();
    fireEvent.click(screen.getByText('Change owner'));
    const dialog = screen.getByTestId('change-owner-dialog');
    expect(JSON.parse(dialog.textContent)).toEqual({ id: 7, name: 'Nightly digest', owner: { id: 3, name: 'Ann' } });
    fireEvent.click(dialog);
    expect(screen.queryByTestId('change-owner-dialog')).not.toBeInTheDocument();
  });

  it('R1.2 offers Pause and not Resume while the schedule is enabled', () => {
    renderMenu({ enabled: true, allowed_actions: ['pause', 'resume'] });
    openMenu();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('R1.2 offers Resume and not Pause while the schedule is paused', () => {
    renderMenu({ enabled: false, allowed_actions: ['pause', 'resume'] });
    openMenu();
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
  });

  it('R1.3 renders no menu when allowed_actions is empty', () => {
    const { container } = renderMenu({ allowed_actions: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('R1.1 calls the handler of the picked action', () => {
    const onRun = vi.fn();
    const onPause = vi.fn();
    renderMenu({ allowed_actions: ['run', 'pause'] }, { onRun, onPause });
    openMenu();
    fireEvent.click(screen.getByText('Run now'));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
  });

  it('R1.1 disables the button while a request runs', () => {
    renderMenu({ allowed_actions: ['run'] }, { isBusy: true });
    expect(screen.getByTestId('schedule-7-menu-button')).toBeDisabled();
  });

  it('R4.1 Delete opens the standard confirmation with the schedule name', () => {
    const onDelete = vi.fn();
    renderMenu({ allowed_actions: ['delete'] }, { onDelete });
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('delete-confirm-message')).toHaveTextContent('Nightly digest');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('R4.1 confirming the typed name calls onDelete', () => {
    const onDelete = vi.fn();
    renderMenu({ allowed_actions: ['delete'] }, { onDelete });
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nightly digest' } });
    fireEvent.click(screen.getByTestId('delete-confirm-button'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('R4.3 cancel keeps the row and sends no request', () => {
    const onDelete = vi.fn();
    renderMenu({ allowed_actions: ['delete'] }, { onDelete });
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-confirm-dialog')).not.toBeInTheDocument();
  });
});
