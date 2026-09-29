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
  it('closes an unsaved draft and resets the dirty flag', async () => {
    const unsavedDirtyRef = { current: false };
    render(
      <ThemeProvider theme={theme}>
        <ChatTemplateEditor
          template={{ id: null, name: 'Template 1', participants: [] }}
          unsavedDirtyRef={unsavedDirtyRef}
          {...handlers}
        />
      </ThemeProvider>,
    );
    expect(unsavedDirtyRef.current).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(unsavedDirtyRef.current).toBe(false);
  });

  it('discards edits on a saved template and closes the editor', async () => {
    const unsavedDirtyRef = { current: false };
    const template = { id: 3, name: 'Sprint', participants: [], is_default: false };
    render(
      <ThemeProvider theme={theme}>
        <ChatTemplateEditor
          template={template}
          allTemplates={[template]}
          unsavedDirtyRef={unsavedDirtyRef}
          {...handlers}
        />
      </ThemeProvider>,
    );
    const nameInput = screen.getByDisplayValue('Sprint');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Renamed');
    expect(unsavedDirtyRef.current).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onSave).not.toHaveBeenCalled();
    expect(unsavedDirtyRef.current).toBe(false);
  });

  it('keeps Cancel enabled on a saved template without changes', () => {
    renderEditor({ id: 3, name: 'Sprint', participants: [], is_default: false });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });
});
