// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';

import { BannerIcon, BannerSeverity } from '../../lib/constants';
import RunIndexBanner from '../RunIndexBanner';

const theme = createTheme({
  palette: {
    border: { table: '#eee' },
    icon: { indexResult: { warning: '#F2994A', info: '#2196f3' } },
    components: {
      runIndexBanner: {
        background: { warning: '#fff3e0', info: '#e3f2fd' },
        border: { warning: '#f2994a', info: '#90caf9' },
        text: { warning: '#663c00', info: '#0d47a1' },
      },
    },
  },
});

const renderBanner = banner =>
  render(
    <ThemeProvider theme={theme}>
      <RunIndexBanner banner={banner} />
    </ThemeProvider>,
  );

describe('RunIndexBanner icons', () => {
  it('lets an overridden icon inherit the banner tone rather than hardcode its own fill', () => {
    const { container } = renderBanner({
      severity: BannerSeverity.warning,
      icon: BannerIcon.attention,
      label: 'Partially indexed',
      message: 'some items are missing',
    });

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('fill')).toBe('currentColor');
  });

  it('still falls back to the severity icon when no named icon is given', () => {
    const { container } = renderBanner({
      severity: BannerSeverity.warning,
      label: 'Stopped',
      message: 'stopped before completion',
    });

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
