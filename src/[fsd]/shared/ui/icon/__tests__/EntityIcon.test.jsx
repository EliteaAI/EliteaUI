// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import EntityIcon from '../EntityIcon';

vi.mock('@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks', () => ({
  useSystemSenderName: () => 'Elitea',
}));

vi.mock('../EntityTypeIcon', () => ({
  default: ({ type }) => <span data-testid={`type-icon-${type}`} />,
}));

const theme = createTheme({ palette: lightPalette });

const renderIcon = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <EntityIcon
        data-testid="entity-icon"
        entityType="application"
        {...props}
      />
    </ThemeProvider>,
  );

const hover = () => fireEvent.mouseEnter(screen.getByTestId('entity-icon'));
const getEditIcon = () => document.querySelector('svg[viewBox="0 0 16 16"]');

describe('EntityIcon edit mode', () => {
  afterEach(() => cleanup());

  it('shows the type icon and no edit icon when not editable', () => {
    renderIcon({ onEditClick: vi.fn() });
    hover();

    expect(screen.getByTestId('type-icon-application')).toBeInTheDocument();
    expect(getEditIcon()).not.toBeInTheDocument();
  });

  it('does not show a dead edit icon when editable has no onEditClick', () => {
    renderIcon({ editable: true });
    hover();

    expect(screen.getByTestId('type-icon-application')).toBeInTheDocument();
    expect(getEditIcon()).not.toBeInTheDocument();
  });

  it('shows the edit icon on hover and calls onEditClick when editable', () => {
    const onEditClick = vi.fn();
    renderIcon({ editable: true, onEditClick });

    expect(getEditIcon()).not.toBeInTheDocument();
    hover();
    expect(getEditIcon()).toBeInTheDocument();
    expect(screen.queryByTestId('type-icon-application')).not.toBeInTheDocument();

    fireEvent.click(getEditIcon());
    expect(onEditClick).toHaveBeenCalledTimes(1);
    expect(getEditIcon()).not.toBeInTheDocument();
  });

  it('renders the custom icon component instead of the type icon', () => {
    renderIcon({ icon: { component: <span data-testid="custom-icon" /> } });

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('type-icon-application')).not.toBeInTheDocument();
  });
});
