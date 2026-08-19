// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SuccessPanel from '../SuccessPanel';

vi.mock('@/[fsd]/features/toolkits/indexes/ui', () => ({
  RunIndexBanner: () => <Box data-testid="banner" />,
}));

vi.mock('../SelectSearchTool', () => ({
  default: () => <Box data-testid="select-search-tool" />,
}));

afterEach(() => cleanup());

const renderPanel = props =>
  render(
    <SuccessPanel
      banner={{ severity: 'success' }}
      searchToolOptions={[]}
      {...props}
    />,
  );

describe('SuccessPanel', () => {
  it('closes a finished run with the banner alone — details live in History', () => {
    renderPanel({ showBanner: true });

    expect(screen.getByTestId('banner')).toBeInTheDocument();
    expect(screen.getByTestId('select-search-tool')).toBeInTheDocument();
  });

  it('shows only the tool picker on a cold visit', () => {
    renderPanel({ showBanner: false });

    expect(screen.queryByTestId('banner')).not.toBeInTheDocument();
    expect(screen.getByTestId('select-search-tool')).toBeInTheDocument();
  });
});
