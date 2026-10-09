// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { useFilePreviewNavigation } from '@/[fsd]/shared/lib/hooks/useFilePreviewNavigation.hooks';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import FilePreviewNavigationProvider from '../FilePreviewNavigationProvider';

vi.mock('@/[fsd]/shared/ui/modal/BaseModal', () => ({
  default: ({ open, onClose, onConfirm }) =>
    open ? (
      <div data-testid="warning-modal">
        <button
          data-testid="cancel"
          onClick={onClose}
        />
        <button
          data-testid="confirm"
          onClick={onConfirm}
        />
      </div>
    ) : null,
}));

let api;
const Consumer = () => {
  api = useFilePreviewNavigation();
  return null;
};

const renderProvider = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <FilePreviewNavigationProvider>
        <Consumer />
      </FilePreviewNavigationProvider>
    </ThemeProvider>,
  );

describe('FilePreviewNavigationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('runs navigation immediately when no file is previewed', () => {
    renderProvider();
    const navigate = vi.fn();

    let allowed;
    act(() => {
      allowed = api.checkNavigationAllowed(navigate);
    });

    expect(allowed).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('warning-modal')).not.toBeInTheDocument();
  });

  it('blocks navigation and shows the warning while a file is previewed', () => {
    renderProvider();
    const navigate = vi.fn();

    act(() => api.setFilePreviewActive(true));
    let allowed;
    act(() => {
      allowed = api.checkNavigationAllowed(navigate);
    });

    expect(allowed).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('warning-modal')).toBeInTheDocument();
  });

  it('drops the pending navigation on cancel', () => {
    renderProvider();
    const navigate = vi.fn();

    act(() => api.setFilePreviewActive(true));
    act(() => {
      api.checkNavigationAllowed(navigate);
    });
    act(() => screen.getByTestId('cancel').click());
    act(() => vi.advanceTimersByTime(500));

    expect(navigate).not.toHaveBeenCalled();
    expect(api.isPreviewingFile).toBe(true);
    expect(screen.queryByTestId('warning-modal')).not.toBeInTheDocument();
  });

  it('closes the preview and runs the pending navigation after a delay on confirm', () => {
    renderProvider();
    const navigate = vi.fn();

    act(() => api.setFilePreviewActive(true));
    act(() => {
      api.checkNavigationAllowed(navigate);
    });
    act(() => screen.getByTestId('confirm').click());

    expect(api.isPreviewingFile).toBe(false);
    expect(navigate).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(150));
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});

describe('useFilePreviewNavigation', () => {
  it('throws outside of the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(/FilePreviewNavigationProvider/);
    spy.mockRestore();
  });
});
