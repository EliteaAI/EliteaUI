// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import IndexDetailsFooterBand from '../IndexDetailsFooterBand';

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: { alarm: 'alarm', elitea: 'elitea' },
    // eslint-disable-next-line no-unused-vars
    BaseBtn: ({ children, startIcon, variant, ...rest }) => <button {...rest}>{children}</button>,
  },
}));

afterEach(() => cleanup());

const theme = createTheme({
  palette: { background: { section: '#111' }, border: { table: '#222' } },
});

const renderFooter = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <IndexDetailsFooterBand {...props} />
    </ThemeProvider>,
  );

const action = () => screen.getByTestId('index-details-footer-action');

describe('IndexDetailsFooterBand', () => {
  it('offers Reindex when nothing is running', () => {
    const onReindex = vi.fn();
    renderFooter({ isRunActive: false, onReindex });

    expect(action()).toHaveTextContent('Reindex');
    fireEvent.click(action());
    expect(onReindex).toHaveBeenCalledTimes(1);
  });

  it('disables Reindex while a run is being set up', () => {
    renderFooter({ isRunActive: false, reindexDisabled: true });

    expect(action()).toBeDisabled();
  });

  it('explains a Reindex the toolkit can no longer run and swallows the click', async () => {
    const onReindex = vi.fn();
    renderFooter({
      isRunActive: false,
      reindexDisabled: true,
      reindexTooltip: 'Enable the “Index data” tool to activate indexing',
      onReindex,
    });

    expect(action()).toBeDisabled();
    fireEvent.click(action());
    expect(onReindex).not.toHaveBeenCalled();

    fireEvent.mouseOver(action().parentElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Enable the “Index data” tool to activate indexing',
    );
  });

  it('offers Stop while indexing', () => {
    const onStop = vi.fn();
    renderFooter({ isRunActive: true, canStopIndexing: true, onStop });

    expect(action()).toHaveTextContent('Stop');
    fireEvent.click(action());
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('keeps Stop unusable until the task id arrives, then while stopping', () => {
    const { rerender } = renderFooter({ isRunActive: true, canStopIndexing: false });
    expect(action()).toHaveTextContent('Starting...');
    expect(action()).toBeDisabled();

    rerender(
      <ThemeProvider theme={theme}>
        <IndexDetailsFooterBand
          isRunActive
          canStopIndexing
          isStoppingIndexing
        />
      </ThemeProvider>,
    );
    expect(action()).toHaveTextContent('Stopping...');
    expect(action()).toBeDisabled();
  });
});
