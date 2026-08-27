// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import IndexDetailsFooterBand from '../IndexDetailsFooterBand';

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: { alarm: 'alarm', elitea: 'elitea', secondary: 'secondary' },
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

const reindex = () => screen.getByTestId('index-details-footer-reindex');
const save = () => screen.getByTestId('index-details-footer-save');
const stop = () => screen.getByTestId('index-details-footer-stop');

describe('IndexDetailsFooterBand', () => {
  it('offers Reindex when nothing is running', () => {
    const onReindex = vi.fn();
    renderFooter({ isRunActive: false, onReindex });

    expect(reindex()).toHaveTextContent('Reindex');
    fireEvent.click(reindex());
    expect(onReindex).toHaveBeenCalledTimes(1);
  });

  it('disables Reindex while a run is being set up', () => {
    renderFooter({ isRunActive: false, reindexDisabled: true });

    expect(reindex()).toBeDisabled();
  });

  it('explains a Reindex the toolkit can no longer run and swallows the click', async () => {
    const onReindex = vi.fn();
    renderFooter({
      isRunActive: false,
      reindexDisabled: true,
      reindexTooltip: 'Enable the “Index data” tool to activate indexing',
      onReindex,
    });

    expect(reindex()).toBeDisabled();
    fireEvent.click(reindex());
    expect(onReindex).not.toHaveBeenCalled();

    fireEvent.mouseOver(reindex().parentElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Enable the “Index data” tool to activate indexing',
    );
  });

  it('offers Stop while indexing', () => {
    const onStop = vi.fn();
    renderFooter({ isRunActive: true, canStopIndexing: true, onStop });

    expect(stop()).toHaveTextContent('Stop');
    fireEvent.click(stop());
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('keeps Stop unusable until the task id arrives, then while stopping', () => {
    const { rerender } = renderFooter({ isRunActive: true, canStopIndexing: false });
    expect(stop()).toHaveTextContent('Starting...');
    expect(stop()).toBeDisabled();

    rerender(
      <ThemeProvider theme={theme}>
        <IndexDetailsFooterBand
          isRunActive
          canStopIndexing
          isStoppingIndexing
        />
      </ThemeProvider>,
    );
    expect(stop()).toHaveTextContent('Stopping...');
    expect(stop()).toBeDisabled();
  });

  it('hides Save until the configuration is edited', () => {
    renderFooter({ isRunActive: false, isDirty: false });

    expect(screen.queryByTestId('index-details-footer-save')).not.toBeInTheDocument();
  });

  it('offers Save alongside Save & Reindex once the configuration is edited', () => {
    const onSave = vi.fn();
    renderFooter({ isRunActive: false, isDirty: true, onSave });

    expect(save()).toHaveTextContent('Save');
    expect(reindex()).toHaveTextContent('Save & Reindex');

    fireEvent.click(save());
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('offers neither Save nor Save & Reindex while a run is active', () => {
    renderFooter({ isRunActive: true, isDirty: true });

    expect(screen.queryByTestId('index-details-footer-save')).not.toBeInTheDocument();
    expect(screen.queryByTestId('index-details-footer-reindex')).not.toBeInTheDocument();
  });

  it('explains an invalid configuration and swallows the Save click', async () => {
    const onSave = vi.fn();
    renderFooter({
      isRunActive: false,
      isDirty: true,
      saveDisabled: true,
      saveTooltip: 'Fill in all required fields',
      onSave,
    });

    expect(save()).toBeDisabled();
    fireEvent.click(save());
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.mouseOver(save().parentElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Fill in all required fields');
  });

  it('locks both actions while the save is in flight', () => {
    renderFooter({ isRunActive: false, isDirty: true, isSaving: true });

    expect(save()).toHaveTextContent('Saving...');
    expect(save()).toBeDisabled();
    expect(reindex()).toBeDisabled();
  });
});
