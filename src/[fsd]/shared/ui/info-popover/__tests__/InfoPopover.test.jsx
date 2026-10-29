// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import InfoPopover from '../InfoPopover';

const STORAGE_KEY = 'test:info-popover:dismissed';
const OTHER_STORAGE_KEY = 'test:other-popover:dismissed';

const theme = createTheme({
  palette: {
    alert: { info: { background: '#e3f2fd', border: '#90caf9', text: '#0d47a1' } },
    background: { surface: { default: '#fff' } },
    icon: { indexResult: { info: '#1976d2' } },
  },
});

const createStorageStub = () => {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
  };
};

const renderPopover = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <InfoPopover
        label="About thing"
        storageKey={STORAGE_KEY}
        testIdPrefix="thing-info"
        {...props}
      >
        <span>Popover body text</span>
      </InfoPopover>
    </ThemeProvider>,
  );

describe('InfoPopover', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageStub());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('labels the trigger with the provided label', () => {
    renderPopover();

    expect(screen.getByTestId('thing-info-button')).toHaveAttribute('aria-label', 'About thing');
  });

  it('opens automatically on first visit', () => {
    renderPopover();

    expect(screen.getByText('Popover body text')).toBeInTheDocument();
    expect(screen.getByTestId('thing-info-button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays closed when it was dismissed before, and can be reopened manually', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    renderPopover();

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('thing-info-button'));

    expect(screen.getByText('Popover body text')).toBeInTheDocument();
  });

  it('does not open automatically when autoOpen is false, but can be opened manually', () => {
    renderPopover({ autoOpen: false });

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('thing-info-button'));

    expect(screen.getByText('Popover body text')).toBeInTheDocument();
  });

  it('calls onAutoOpen only when it actually opens automatically', () => {
    const onAutoOpen = vi.fn();
    renderPopover({ onAutoOpen });

    expect(onAutoOpen).toHaveBeenCalledTimes(1);

    cleanup();
    localStorage.setItem(STORAGE_KEY, 'true');
    const onAutoOpenDismissed = vi.fn();
    renderPopover({ onAutoOpen: onAutoOpenDismissed });

    expect(onAutoOpenDismissed).not.toHaveBeenCalled();
  });

  it('toggles closed when the trigger is clicked while open', () => {
    renderPopover();

    fireEvent.click(screen.getByTestId('thing-info-button'));

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists the dismissal when the X button is clicked', () => {
    renderPopover();

    fireEvent.click(screen.getByTestId('thing-info-close-button'));

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('closes on click-away without persisting the dismissal', async () => {
    renderPopover();

    // ClickAwayListener only starts listening after a macrotask following mount.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    fireEvent.click(document.body);

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('closes on Escape without persisting the dismissal and returns focus to the trigger', () => {
    renderPopover();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('thing-info-button')).toHaveFocus();
  });

  it('keeps dismissals independent per storage key', () => {
    localStorage.setItem(OTHER_STORAGE_KEY, 'true');
    renderPopover();

    expect(screen.getByText('Popover body text')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('thing-info-close-button'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    expect(localStorage.getItem(OTHER_STORAGE_KEY)).toBe('true');
  });

  it('still opens and closes when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
    renderPopover();

    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('thing-info-button'));
    expect(screen.getByText('Popover body text')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('thing-info-close-button'));
    expect(screen.queryByText('Popover body text')).not.toBeInTheDocument();
  });
});
