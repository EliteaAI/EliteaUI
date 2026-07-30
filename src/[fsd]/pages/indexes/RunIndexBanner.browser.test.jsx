import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  IndexStatuses,
  PARTLY_INDEXED_REINDEX_MESSAGE,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { bannerVariant } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';

import RunIndexBanner from './RunIndexBanner';

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
        <ThemeProvider theme={createTheme()}>
          <RunIndexBanner
            banner={bannerVariant(false, false, IndexStatuses.partlyOk)}
            dismissed
            onDismiss={() => {}}
            isIndexing={false}
            isStoppingIndexing={false}
            onCancelIndexing={() => {}}
          />
        </ThemeProvider>,
      );
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain(PARTLY_INDEXED_REINDEX_MESSAGE);
    expect(alert.className).toContain('MuiAlert-outlinedWarning');
    expect(container.querySelector('button')).toBeNull();
  });
});
