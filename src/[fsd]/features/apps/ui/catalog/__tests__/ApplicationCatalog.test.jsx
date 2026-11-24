// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { APPLICATION_CATALOG } from '../../../lib/constants/applicationCatalog.constants';
import ApplicationCatalog from '../ApplicationCatalog';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/[fsd]/features/interactive-tours', () => ({
  APPLICATIONS_TOUR_TARGET_IDS: { catalogGrid: 'applications-catalog-grid' },
}));
vi.mock('@/[fsd]/features/apps/lib/hooks', () => ({
  useApplicationCatalogState: () => ({
    applications: APPLICATION_CATALOG.map(application => ({
      ...application,
      id: application.type,
      typeLabel: application.name,
      canCreate: true,
    })),
    isLoading: false,
  }),
  useApplicationRequests: () => ({
    getRequestStatus: () => 'none',
    submitRequest: vi.fn(),
    isSubmitting: false,
    isFetching: false,
  }),
}));
vi.mock('../ApplicationCatalogCard', () => ({
  default: ({ application, onConfigure }) => (
    <div data-testid="catalog-card">
      {application.name}
      <button
        type="button"
        onClick={() => onConfigure(application)}
      >
        Configure {application.name}
      </button>
    </div>
  ),
}));
vi.mock('../RequestAccessModal', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const renderCatalog = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ApplicationCatalog {...props} />
    </ThemeProvider>,
  );

const cardNames = () => screen.queryAllByTestId('catalog-card').map(card => card.firstChild.textContent);

describe('ApplicationCatalog', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows every catalog card in catalog order', () => {
    renderCatalog();
    expect(cardNames()).toEqual(['Wikis', 'Inventory', 'Questionnaire']);
  });

  it('filters the cards by the search', () => {
    renderCatalog({ query: 'wiki' });
    expect(cardNames()).toEqual(['Wikis']);
  });

  it('says so when nothing matches', () => {
    renderCatalog({ query: 'zzz' });
    expect(cardNames()).toEqual([]);
    expect(screen.getByTestId('catalog-no-results-title')).toHaveTextContent('No applications found');
  });

  it('opens the configuration of the picked type', () => {
    renderCatalog();
    fireEvent.click(screen.getByRole('button', { name: 'Configure Inventory' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/apps/create/inventory');
  });
});
