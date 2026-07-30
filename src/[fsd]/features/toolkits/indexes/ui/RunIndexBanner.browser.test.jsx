import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  IndexStatuses,
  PARTLY_INDEXED_REINDEX_MESSAGE,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { bannerVariant } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';

import RunIndexBanner from './RunIndexBanner';

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: { alarm: 'alarm' },
    BaseBtn: props => <button disabled={props.disabled}>{props.children}</button>,
  },
}));
vi.mock('@/assets/error-icon.svg?react', () => ({ default: () => <span data-testid="error-icon" /> }));
vi.mock('@/assets/fail-icon.svg?react', () => ({ default: () => <span data-testid="warning-icon" /> }));
vi.mock('@/assets/success-icon.svg?react', () => ({ default: () => <span data-testid="success-icon" /> }));

describe('RunIndexBanner partial index presentation', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('renders a persistent warning that recommends reindexing', async () => {
    await act(async () => {
      root.render(
        <ThemeProvider
          theme={createTheme({
            palette: {
              background: { indexResult: { warning: '#fff8e1' } },
              border: { table: '#ddd', indexResult: { warning: '#f9a825' } },
              icon: { indexResult: { warning: '#f57f17' } },
              text: { indexResult: { warning: '#5d4037' } },
            },
          })}
        >
          <RunIndexBanner
            banner={bannerVariant(false, IndexStatuses.partlyOk)}
            isIndexing={false}
            isStoppingIndexing={false}
            onStop={() => {}}
          />
        </ThemeProvider>,
      );
    });

    expect(container.textContent).toContain('Index completed with partial results');
    expect(container.textContent).toContain(PARTLY_INDEXED_REINDEX_MESSAGE);
    expect(container.querySelector('button')).toBeNull();
  });
});
