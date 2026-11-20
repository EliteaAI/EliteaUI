// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/components/DotMenu.jsx', () => ({ default: () => null }));

const { default: FolderAccordion } = await import('../FolderAccordion');

const theme = createTheme(getDesignTokens('dark'));
const ITEMS = [{ title: 'Hiring', content: <div data-testid="folder-content" /> }];

const renderAccordion = initialProps => {
  const element = props => (
    <ThemeProvider theme={theme}>
      <FolderAccordion
        folderId={200}
        items={ITEMS}
        {...props}
      />
    </ThemeProvider>
  );
  const view = render(element(initialProps));
  return { ...view, rerenderWith: nextProps => view.rerender(element(nextProps)) };
};

const folder = () => screen.getByTestId('chat-folder-item-200');
const toggle = () => fireEvent.click(screen.getByRole('button', { name: /Hiring/ }));

describe('FolderAccordion', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('starts from the default when nothing is kept', () => {
    renderAccordion({ defaultExpanded: true });
    expect(folder()).toHaveAttribute('data-expanded', 'true');
  });

  it("starts from the user's kept choice over the default", () => {
    renderAccordion({ defaultExpanded: true, storedExpanded: false });
    expect(folder()).toHaveAttribute('data-expanded', 'false');

    cleanup();
    renderAccordion({ defaultExpanded: false, storedExpanded: true });
    expect(folder()).toHaveAttribute('data-expanded', 'true');
  });

  it('reports every toggle so it can be kept', () => {
    const onExpandedChange = vi.fn();
    renderAccordion({ onExpandedChange });

    toggle();
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    toggle();
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
  });

  it('opens and keeps it when the default turns on later (e.g. its chat gets selected)', () => {
    const onExpandedChange = vi.fn();
    const { rerenderWith } = renderAccordion({
      defaultExpanded: false,
      storedExpanded: false,
      onExpandedChange,
    });
    expect(folder()).toHaveAttribute('data-expanded', 'false');
    expect(onExpandedChange).not.toHaveBeenCalled();

    rerenderWith({ defaultExpanded: true, storedExpanded: false, onExpandedChange });
    expect(folder()).toHaveAttribute('data-expanded', 'true');
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
