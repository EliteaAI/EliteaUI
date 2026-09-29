// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatTemplateEditor from '../ChatTemplateEditor';

vi.mock('../ChatParticipantPicker', () => ({ default: () => null }));
vi.mock('@/hooks/useToast', () => ({ default: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }) }));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const handlers = {
  onSave: vi.fn(),
  onDelete: vi.fn(),
  onSetDefault: vi.fn(),
  onUnsetDefault: vi.fn(),
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

describe('ChatTemplateEditor default actions', () => {
  it('hides default and delete actions on an unsaved draft', () => {
    renderEditor({ id: null, name: 'Template 1', participants: [] });
    expect(screen.queryByRole('button', { name: 'Set as default' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unset default' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete template' })).not.toBeInTheDocument();
  });

  it('offers Set as default on a saved non-default template', async () => {
    renderEditor({ id: 3, name: 'Sprint', participants: [], is_default: false });
    expect(screen.queryByRole('button', { name: 'Unset default' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Set as default' }));
    expect(handlers.onSetDefault).toHaveBeenCalledWith(3);
  });

  it('offers Unset default on the default template', async () => {
    renderEditor({ id: 5, name: 'Main', participants: [], is_default: true });
    expect(screen.queryByRole('button', { name: 'Set as default' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Unset default' }));
    expect(handlers.onUnsetDefault).toHaveBeenCalledWith(5);
  });

  it('allows deleting the default template', () => {
    renderEditor({ id: 5, name: 'Main', participants: [], is_default: true });
    expect(screen.getByRole('button', { name: 'Delete template' })).toBeInTheDocument();
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
