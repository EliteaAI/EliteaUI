// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CatalogBody from '../CatalogBody';

vi.mock('../CategoryRail', () => ({ default: () => <div data-testid="category-rail" /> }));

const theme = createTheme(getDesignTokens('dark'));

const renderBody = props =>
  render(
    <ThemeProvider theme={theme}>
      <CatalogBody
        allCategories={['Trending', 'My Liked', 'New', 'Coding']}
        selectedCategories={['Coding']}
        groupedItems={{ Coding: [{ id: 1 }] }}
        renderCategory={category => <div key={category}>{category} section</div>}
        {...props}
      />
    </ThemeProvider>,
  );

describe('CatalogBody rail', () => {
  afterEach(() => cleanup());

  it('shows the categories rail by default', () => {
    renderBody();
    expect(screen.getByTestId('category-rail')).toBeInTheDocument();
  });

  it('shows card skeletons while loading', () => {
    renderBody({ isLoading: true });
    expect(screen.getByTestId('catalog-loading').children).toHaveLength(12);
    expect(screen.queryByText('Coding section')).not.toBeInTheDocument();
  });

  it('says nothing was found instead of an empty page when every section is filtered out', () => {
    renderBody({
      groupedItems: { Coding: [] },
      renderNoResults: title => <div>{title}</div>,
      noResultsTitle: 'No agents found',
    });
    expect(screen.getByText('No agents found')).toBeInTheDocument();
  });

  it('hides the rail but keeps the picked categories filtering', () => {
    renderBody({ showRail: false });
    expect(screen.queryByTestId('category-rail')).not.toBeInTheDocument();
    expect(screen.getByText('Coding section')).toBeInTheDocument();
  });
});
