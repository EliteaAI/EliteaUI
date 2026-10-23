// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ErrorTrace from '../ErrorTrace';

vi.mock('../BudgetErrorMessage', () => ({ default: () => null }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/assets/arrow-right-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/CopyIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/DownloadIcon', () => ({ default: () => null }));

const theme = createTheme({
  palette: {
    border: { error: '#f00' },
    background: { error: '#fee', surface: { interactive: { default: '#eee', active: '#ddd' } } },
    text: { warning: '#900', primary: '#000', secondary: '#555' },
    icon: { default: '#000' },
  },
});

const renderTrace = props =>
  render(
    <ThemeProvider theme={theme}>
      <ErrorTrace {...props} />
    </ThemeProvider>,
  );

const DENIED = { code: 'DENIED_GRANT', error: 'This agent is not allowed to use one of its credentials for you.' };

describe('ErrorTrace', () => {
  afterEach(() => cleanup());

  it('shows the refusal text with its code chip and keeps the debugging accordion', () => {
    const trace = JSON.stringify(DENIED, null, 2);
    renderTrace({ headline: '', trace });

    expect(screen.getByText(DENIED.error)).toBeTruthy();
    expect(screen.getByTestId('error-code-chip').textContent).toBe('DENIED_GRANT');
    expect(screen.queryByText('Unknown error')).toBeNull();

    fireEvent.click(screen.getByText('Error debugging info'));
    expect(screen.getByText((_, el) => el?.tagName === 'PRE' && el.textContent === trace)).toBeTruthy();
  });

  it('keeps the generic text when the payload has no error string', () => {
    renderTrace({ headline: '', trace: JSON.stringify({ code: 'DENIED_GRANT' }) });

    expect(screen.getByText('Unknown error')).toBeTruthy();
    expect(screen.queryByTestId('error-code-chip')).toBeNull();
  });

  it('keeps the generic text for a plain-text trace', () => {
    renderTrace({ headline: '', trace: 'Traceback: boom' });

    expect(screen.getByText('Unknown error')).toBeTruthy();
    expect(screen.queryByTestId('error-code-chip')).toBeNull();
  });

  it('does not override an existing headline', () => {
    renderTrace({ headline: 'Model said no', trace: JSON.stringify(DENIED) });

    expect(screen.getByText('Model said no')).toBeTruthy();
    expect(screen.queryByTestId('error-code-chip')).toBeNull();
  });
});
