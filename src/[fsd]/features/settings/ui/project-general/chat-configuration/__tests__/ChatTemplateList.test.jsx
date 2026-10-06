// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatTemplateList from '../ChatTemplateList';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const templates = [
  { id: 1, name: 'Main', participants: [], is_default: true },
  { id: 2, name: 'Sprint', participants: [], is_default: false },
];
const handlers = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

const renderList = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ChatTemplateList
        templates={templates}
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('ChatTemplateList row actions', () => {
  it('opens the editor from the edit action', async () => {
    renderList();
    await userEvent.click(screen.getByTestId('template-edit-2'));
    expect(handlers.onEdit).toHaveBeenCalledWith(2);
  });

  it('requests deletion of the template from the delete action', async () => {
    renderList();
    await userEvent.click(screen.getByTestId('template-delete-1'));
    expect(handlers.onDelete).toHaveBeenCalledWith(expect.objectContaining(templates[0]));
  });

  it('does not open the editor when the row itself is clicked', async () => {
    renderList();
    await userEvent.click(screen.getByText('Sprint'));
    expect(handlers.onEdit).not.toHaveBeenCalled();
  });

  it('labels the row action as View for read-only users', () => {
    renderList({ canEdit: false, onDelete: undefined });
    expect(screen.getByRole('button', { name: 'View Main' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Main' })).not.toBeInTheDocument();
  });

  it('hides the delete action without delete permission', () => {
    renderList({ onDelete: undefined });
    expect(screen.getByTestId('template-edit-1')).toBeInTheDocument();
    expect(screen.queryByTestId('template-delete-1')).not.toBeInTheDocument();
  });
});
