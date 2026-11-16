// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

const selects = vi.hoisted(() => ({ items: [] }));

vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => {
    selects.items.push(props);
    return <div data-testid={props['data-testid']} />;
  },
}));
vi.mock('@/[fsd]/entities/version', () => ({
  buildVersionOption: () => version => ({ label: version.name, value: version.id }),
  formatVersionMeta: () => '',
}));

const { default: ComparePublicVersionSelector } = await import('../ComparePublicVersionSelector');

const theme = createTheme({ palette: darkPalette });
const LOCAL = [
  { id: 1, name: 'base', created_at: '2026-01-01' },
  { id: 2, name: 'v2', created_at: '2026-02-01' },
];
const PUBLIC = [
  { id: 501, name: 'v1', created_at: '2026-03-01' },
  { id: 502, name: 'v2', created_at: '2026-04-01' },
];

const renderSelector = props => {
  selects.items = [];
  return render(
    <ThemeProvider theme={theme}>
      <ComparePublicVersionSelector
        versions={LOCAL}
        leftVersionId={2}
        onLeftVersionChange={vi.fn()}
        publicVersions={PUBLIC}
        rightVersionId={502}
        onRightVersionChange={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
};

const selectFor = testId => selects.items.find(item => item['data-testid'] === testId);

describe('ComparePublicVersionSelector', () => {
  afterEach(() => cleanup());

  it('lets the user pick a version of their agent, newest first, with the open one chosen', () => {
    renderSelector();
    const select = selectFor('compare-local-version-select');
    expect(select.value).toBe(2);
    expect(select.options.map(option => option.value)).toEqual([2, 1]);
  });

  it('lets the user pick a published public version, newest first', () => {
    renderSelector();
    const select = selectFor('compare-public-version-select');
    expect(select.value).toBe(502);
    expect(select.options.map(option => option.value)).toEqual([502, 501]);
  });

  it('reports a change of either side', () => {
    const onLeftVersionChange = vi.fn();
    const onRightVersionChange = vi.fn();
    renderSelector({ onLeftVersionChange, onRightVersionChange });
    selectFor('compare-local-version-select').onValueChange(1);
    selectFor('compare-public-version-select').onValueChange(501);
    expect(onLeftVersionChange).toHaveBeenCalledWith(1);
    expect(onRightVersionChange).toHaveBeenCalledWith(501);
  });

  it('shows a loader instead of the public select while the versions load', () => {
    renderSelector({ isLoading: true, publicVersions: [] });
    expect(screen.getByTestId('compare-public-loading')).toHaveTextContent('Loading the public versions...');
    expect(screen.queryByTestId('compare-public-version-select')).not.toBeInTheDocument();
  });

  it('shows why the public versions are missing', () => {
    renderSelector({ loadError: 'The public versions could not be loaded.', publicVersions: [] });
    expect(screen.getByTestId('compare-public-error')).toHaveTextContent(
      'The public versions could not be loaded.',
    );
    expect(screen.queryByTestId('compare-public-version-select')).not.toBeInTheDocument();
  });

  it('says so when the public agent has no published version', () => {
    renderSelector({ publicVersions: [] });
    expect(screen.getByTestId('compare-public-empty')).toHaveTextContent(
      'The public agent has no published version.',
    );
  });

  it('still lets the user choose their own version while the public ones load', () => {
    renderSelector({ isLoading: true, publicVersions: [] });
    expect(screen.getByTestId('compare-local-version-select')).toBeInTheDocument();
  });

  it('does not change the lists it was given', () => {
    renderSelector();
    expect(LOCAL.map(version => version.id)).toEqual([1, 2]);
    expect(PUBLIC.map(version => version.id)).toEqual([501, 502]);
  });
});
