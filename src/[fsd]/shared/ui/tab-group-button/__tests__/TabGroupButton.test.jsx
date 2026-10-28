// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import TabGroupButton from '../TabGroupButton';

const theme = createTheme(getDesignTokens('dark'));

afterEach(() => cleanup());

describe('TabGroupButton', () => {
  it('stays below dialogs, so an open dialog is never covered by the tabs', () => {
    render(
      <ThemeProvider theme={theme}>
        <TabGroupButton
          data-testid="tabs"
          disableTooltip
          arrayBtn={[
            { value: 'builder', label: 'Builder' },
            { value: 'cron', label: 'Cron expression' },
          ]}
        />
      </ThemeProvider>,
    );

    const zIndex = Number(getComputedStyle(screen.getByTestId('tabs')).zIndex);
    expect(zIndex).toBe(theme.zIndex.appBar);
    expect(zIndex).toBeLessThan(theme.zIndex.modal);
  });

  it('stays below drawer, modal, popover and tooltip layers', () => {
    const { appBar, drawer, modal, tooltip } = theme.zIndex;
    const popover = theme.zIndex.popover ?? modal;

    expect(appBar).toBeLessThan(drawer);
    expect(appBar).toBeLessThan(modal);
    expect(appBar).toBeLessThan(popover);
    expect(appBar).toBeLessThan(tooltip);
  });
});
