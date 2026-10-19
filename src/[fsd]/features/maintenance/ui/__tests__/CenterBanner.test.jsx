// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { getBannerStyleMap } from '@/[fsd]/features/maintenance/lib/helpers';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CenterBanner from '../CenterBanner';

const theme = createTheme({ palette: darkPalette });
const styleTokens = getBannerStyleMap(theme.palette).info;

const banner = (overrides = {}) => ({
  id: 1,
  message: '**Announcing ELITEA 2.0.7!**<br>Check out the release notes',
  dismissible: true,
  placement: 'center',
  style: 'info',
  icon: 'info',
  ...overrides,
});

const renderBanner = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <CenterBanner
        banner={banner()}
        styleTokens={styleTokens}
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('CenterBanner', () => {
  it('renders the configured icon', () => {
    renderBanner();
    expect(screen.getByTestId('platform-banner-icon')).toBeInTheDocument();
  });

  it.each([null, 'none'])('renders no icon when the icon is %s', icon => {
    renderBanner({ banner: banner({ icon }) });
    expect(screen.queryByTestId('platform-banner-icon')).not.toBeInTheDocument();
    expect(screen.getByText('Announcing ELITEA 2.0.7!')).toBeInTheDocument();
  });

  it('closes on "Got it"', async () => {
    const onClose = vi.fn();
    renderBanner({ onClose });
    await userEvent.click(screen.getByTestId('platform-banner-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no close button when the banner is not dismissible', () => {
    renderBanner({ banner: banner({ dismissible: false }) });
    expect(screen.queryByTestId('platform-banner-close')).not.toBeInTheDocument();
  });
});
