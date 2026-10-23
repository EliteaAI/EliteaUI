// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleDetailMenu from '../ScheduleDetailMenu';

// EL-7011 CR-16 (US-43 R4.3 to R4.5): the Edit schedule page header menu with Export only

const mocks = vi.hoisted(() => ({
  onExport: vi.fn(),
  canExport: true,
  isBusy: false,
}));

vi.mock('@/[fsd]/features/schedule', () => ({
  useScheduleRowActions: () => ({
    onExport: mocks.canExport ? mocks.onExport : undefined,
    isBusy: mocks.isBusy,
  }),
}));
// DotMenu reads it for its confirmation items
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));

const theme = createTheme(getDesignTokens('light'));
const schedule = { id: 9, name: 'Nightly' };

const renderMenu = () =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleDetailMenu schedule={schedule} />
    </ThemeProvider>,
  );
const openMenu = () => fireEvent.click(screen.getByTestId('schedule-detail-menu-button'));

describe('ScheduleDetailMenu EL-7011 CR-16', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.canExport = true;
    mocks.isBusy = false;
  });

  it('R4.3 disables Export while an export runs, so a second click starts no second download', () => {
    mocks.isBusy = true;
    renderMenu();
    openMenu();
    expect(screen.getByRole('menuitem', { name: /Export/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('R4.3 shows only Export, and Export exports this schedule', () => {
    renderMenu();
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Export']);
    fireEvent.click(screen.getByText('Export'));
    expect(mocks.onExport).toHaveBeenCalledTimes(1);
  });

  it('R4.5 renders no menu without the export permission', () => {
    mocks.canExport = false;
    const { container } = renderMenu();
    expect(container).toBeEmptyDOMElement();
  });
});
