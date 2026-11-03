// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRowActions from '../ScheduleRowActions';

// row action menu filtered by allowed_actions.

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

describe('ScheduleRowActions', () => {
  afterEach(cleanup);

  it('shows only the actions the row allows', () => {
    renderMenu({ allowed_actions: ['run', 'pause'] });
    openMenu();
    expect(screen.getByText('Run now')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('ignores server actions the menu does not offer', () => {
    renderMenu({ allowed_actions: ['unknown', 'delete'] });
    openMenu();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('lists Run now, Edit, Pause, Change owner and Delete in this order', () => {
    renderMenu({ allowed_actions: ['delete', 'change_owner', 'pause', 'edit', 'run'] });
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Run now',
      'Edit',
      'Pause',
      'Change owner',
      'Delete',
    ]);
  });

  it('the table menu lists Open run history between Pause and Change owner', () => {
    renderMenu(
      { allowed_actions: ['delete', 'change_owner', 'pause', 'edit', 'run'] },
      { onOpenRunHistory: vi.fn() },
    );
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Run now',
      'Edit',
      'Pause',
      'Open run history',
      'Change owner',
      'Delete',
    ]);
  });

  it('Edit shows only when edit is allowed and calls onEdit', () => {
    const onEdit = vi.fn();
    renderMenu({ allowed_actions: ['edit'] }, { onEdit });
    openMenu();
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    cleanup();
    renderMenu({ allowed_actions: ['run'] }, { onEdit });
    openMenu();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('TC-US35-22 the card menu lists Run now, Edit, Pause, Open run history and Delete', () => {
    renderMenu(
      { allowed_actions: ['delete', 'change_owner', 'pause', 'edit', 'run'] },
      { onEdit: vi.fn(), onOpenRunHistory: vi.fn(), hideChangeOwner: true },
    );
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Run now',
      'Edit',
      'Pause',
      'Open run history',
      'Delete',
    ]);
  });

  it('TC-US35-12 Open run history needs edit and calls onOpenRunHistory', () => {
    const onOpenRunHistory = vi.fn();
    renderMenu({ allowed_actions: ['edit'] }, { onOpenRunHistory });
    openMenu();
    fireEvent.click(screen.getByText('Open run history'));
    expect(onOpenRunHistory).toHaveBeenCalledTimes(1);
    cleanup();
    renderMenu({ allowed_actions: ['run', 'delete'] }, { onOpenRunHistory });
    openMenu();
    expect(screen.queryByText('Open run history')).not.toBeInTheDocument();
  });

  it('the page menu offers no Open run history without the handler', () => {
    renderMenu({ allowed_actions: ['edit'] }, { onEdit: vi.fn() });
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Edit']);
  });

  it('shows Change owner only when change_owner is allowed', () => {
    renderMenu({ allowed_actions: ['run'] });
    openMenu();
    expect(screen.queryByText('Change owner')).not.toBeInTheDocument();
  });

  it('Change owner opens the dialog with the row schedule and closes it', () => {
    renderMenu({ allowed_actions: ['change_owner'], owner: { id: 3, name: 'Ann' } });
    expect(screen.queryByTestId('change-owner-dialog')).not.toBeInTheDocument();
    openMenu();
    fireEvent.click(screen.getByText('Change owner'));
    const dialog = screen.getByTestId('change-owner-dialog');
    expect(JSON.parse(dialog.textContent)).toEqual({
      id: 7,
      name: 'Nightly digest',
      owner: { id: 3, name: 'Ann' },
    });
    fireEvent.click(dialog);
    expect(screen.queryByTestId('change-owner-dialog')).not.toBeInTheDocument();
  });

  it('offers Pause and not Resume while the schedule is enabled', () => {
    renderMenu({ enabled: true, allowed_actions: ['pause', 'resume'] });
    openMenu();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('offers Resume and not Pause while the schedule is paused', () => {
    renderMenu({ enabled: false, allowed_actions: ['pause', 'resume'] });
    openMenu();
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
  });

  it('renders no menu when allowed_actions is empty', () => {
    const { container } = renderMenu({ allowed_actions: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows Export before Delete when onExport is given, and calls it', () => {
    const onExport = vi.fn();
    renderMenu({ allowed_actions: ['delete', 'edit', 'run'] }, { onExport });
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Run now',
      'Edit',
      'Export',
      'Delete',
    ]);
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('shows no Export without onExport (no export permission)', () => {
    renderMenu({ allowed_actions: ['edit', 'delete'] });
    openMenu();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('calls the handler of the picked action', () => {
    const onRun = vi.fn();
    const onPause = vi.fn();
    renderMenu({ allowed_actions: ['run', 'pause'] }, { onRun, onPause });
    openMenu();
    fireEvent.click(screen.getByText('Run now'));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
  });

  it('disables the button while a request runs', () => {
    renderMenu({ allowed_actions: ['run'] }, { isBusy: true });
    expect(screen.getByTestId('schedule-7-menu-button')).toBeDisabled();
  });

  it('Delete opens the standard confirmation with the schedule name', () => {
    const onDelete = vi.fn();
    renderMenu({ allowed_actions: ['delete'] }, { onDelete });
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('delete-confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('delete-confirm-message')).toHaveTextContent('Nightly digest');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('confirming the typed name calls onDelete', () => {
    const onDelete = vi.fn();
    renderMenu({ allowed_actions: ['delete'] }, { onDelete });
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Nightly digest' } });
    fireEvent.click(screen.getByTestId('delete-confirm-button'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('every menu item shows an icon left of its label', () => {
    renderMenu(
      { allowed_actions: ['run', 'edit', 'pause', 'change_owner', 'delete'] },
      { onOpenRunHistory: vi.fn() },
    );
    openMenu();
    ['run', 'edit', 'pause', 'history', 'change_owner', 'delete'].forEach(key => {
      const item = screen.getByTestId(`${key}-menuitem`);
      const icon = item.querySelector('.MuiListItemIcon-root svg');
      expect(icon, key).not.toBeNull();
      expect(item.firstElementChild).toHaveClass('MuiListItemIcon-root');
    });
  });

  it('Resume shows an icon', () => {
    renderMenu({ enabled: false, allowed_actions: ['resume'] });
    openMenu();
    expect(screen.getByTestId('resume-menuitem').querySelector('.MuiListItemIcon-root svg')).not.toBeNull();
  });

  it('icons use the muted icon colour and Delete uses the error colour', () => {
    renderMenu({ allowed_actions: ['edit', 'delete'] });
    openMenu();
    const editIcon = screen.getByTestId('edit-menuitem').querySelector('.MuiListItemIcon-root');
    expect(editIcon).toHaveStyle({ color: theme.palette.icon.default });
    const deleteItem = screen.getByTestId('delete-menuitem');
    expect(deleteItem.querySelector('.MuiListItemIcon-root')).toHaveStyle({
      color: theme.palette.icon.error,
    });
    expect(deleteItem.querySelector('.MuiListItemText-primary')).toHaveStyle({
      color: theme.palette.text.error,
    });
  });

  it('cancel keeps the row and sends no request', () => {
    const onDelete = vi.fn();
    renderMenu({ allowed_actions: ['delete'] }, { onDelete });
    openMenu();
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-confirm-dialog')).not.toBeInTheDocument();
  });

  it('#7254: an admin sees Run now disabled, with who can run it', () => {
    const onRun = vi.fn();
    renderMenu(
      {
        version_id: 4,
        owner: { id: 1, name: 'Ann Lee' },
        allowed_actions: ['edit', 'pause', 'delete', 'change_owner'],
      },
      { onRun },
    );
    openMenu();
    const item = screen.getByRole('menuitem', { name: /Run now/ });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(item);
    expect(onRun).not.toHaveBeenCalled();
    // the menu's tooltip names the item with the hint
    expect(screen.getByLabelText('Only the schedule owner, Ann Lee, can run it.')).toHaveTextContent(
      'Run now',
    );
  });

  it('#7254: the owner of a schedule without a version gets no Run now, as before', () => {
    renderMenu({
      version_id: null,
      owner: { id: 1, name: 'Ann Lee' },
      allowed_actions: ['edit', 'change_owner'],
    });
    openMenu();
    expect(screen.queryByText('Run now')).not.toBeInTheDocument();
  });
});
