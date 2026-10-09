// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatTemplateEditor from '../ChatTemplateEditor';

vi.mock('../ChatParticipantPicker', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const handlers = {
  onSave: vi.fn(),
  onCancel: vi.fn(),
};
const renderEditor = template =>
  render(
    <ThemeProvider theme={theme}>
      <ChatTemplateEditor
        template={template}
        allTemplates={template.id === null ? [] : [template]}
        {...handlers}
      />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('ChatTemplateEditor modal', () => {
  it('shows "Create Template" on an unsaved draft', () => {
    renderEditor({ id: null, name: 'Template 1', participants: [] });
    expect(screen.getByText('Create Template')).toBeInTheDocument();
  });

  it('shows "Edit Template" without a Delete action on a saved template', () => {
    renderEditor({ id: 5, name: 'Main', participants: [], is_default: true });
    expect(screen.getByText('Edit Template')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows "View Template" for read-only users', () => {
    render(
      <ThemeProvider theme={theme}>
        <ChatTemplateEditor
          template={{ id: 5, name: 'Main', participants: [] }}
          allTemplates={[]}
          canEdit={false}
          {...handlers}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('View Template')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('creates a draft with the default flag set', async () => {
    renderEditor({ id: null, name: 'Template 1', participants: [] });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Set as default' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(handlers.onSave).toHaveBeenCalledWith({
      id: null,
      name: 'Template 1',
      participants: [],
      isDefault: true,
    });
  });
});

describe('ChatTemplateEditor default checkbox', () => {
  it('reflects the saved default state', () => {
    renderEditor({ id: 5, name: 'Main', participants: [], is_default: true });
    expect(screen.getByRole('checkbox', { name: 'Set as default' })).toBeChecked();
  });

  it('enables Save only after toggling the default flag', async () => {
    renderEditor({ id: 3, name: 'Sprint', participants: [], is_default: false });
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Set as default' }));
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);
    expect(handlers.onSave).toHaveBeenCalledWith({
      id: 3,
      name: 'Sprint',
      participants: [],
      isDefault: true,
    });
  });

  it('unsets the default flag on save', async () => {
    renderEditor({ id: 5, name: 'Main', participants: [], is_default: true });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Set as default' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(handlers.onSave).toHaveBeenCalledWith({ id: 5, name: 'Main', participants: [], isDefault: false });
  });
});

describe('ChatTemplateEditor Cancel', () => {
  it('clicking Cancel on a new draft calls onCancel', async () => {
    render(
      <ThemeProvider theme={theme}>
        <ChatTemplateEditor
          template={{ id: null, name: 'Template 1', participants: [] }}
          {...handlers}
        />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it('notifies parent of dirty state and calls onCancel when Cancel is clicked', async () => {
    const onDirtyChange = vi.fn();
    const template = { id: 3, name: 'Sprint', participants: [], is_default: false };
    render(
      <ThemeProvider theme={theme}>
        <ChatTemplateEditor
          template={template}
          allTemplates={[template]}
          onDirtyChange={onDirtyChange}
          {...handlers}
        />
      </ThemeProvider>,
    );
    const nameInput = screen.getByDisplayValue('Sprint');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Renamed');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onSave).not.toHaveBeenCalled();
  });

  it('keeps Cancel enabled on a saved template without changes', () => {
    renderEditor({ id: 3, name: 'Sprint', participants: [], is_default: false });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });
});
