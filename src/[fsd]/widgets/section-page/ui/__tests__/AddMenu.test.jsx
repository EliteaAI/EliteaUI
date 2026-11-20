// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AddMenu from '../AddMenu';

const theme = createTheme(getDesignTokens('dark'));

const renderMenu = items =>
  render(
    <ThemeProvider theme={theme}>
      <AddMenu
        items={items}
        label="Add agent"
        testId="agents-add-button"
      />
    </ThemeProvider>,
  );

describe('AddMenu', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders nothing without items', () => {
    renderMenu([]);
    expect(screen.queryByTestId('agents-add-button')).not.toBeInTheDocument();
  });

  it('opens the list and runs the picked action', () => {
    const onNew = vi.fn();
    const onImport = vi.fn();
    renderMenu([
      { key: 'new', label: 'New Agent', onSelect: onNew, testId: 'agents-add-new' },
      { key: 'import', label: 'Import from file', onSelect: onImport, testId: 'agents-import-button' },
    ]);

    const button = screen.getByTestId('agents-add-button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('New Agent')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('agents-import-button'));
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onNew).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
