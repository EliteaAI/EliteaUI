import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { actions, selectHistoryItem } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { configureStore } from '@reduxjs/toolkit';

import IndexHistory from './IndexHistory';

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistorySortableHeader: () => null,
}));

vi.mock('@/[fsd]/features/toolkits/indexes/model/indexes.slice', () => ({
  default: (state = { selectedHistoryItem: null }, action) =>
    action.type === 'indexes/selectHistoryItem' ? { ...state, selectedHistoryItem: action.payload } : state,
  actions: {
    selectHistoryItem: payload => ({
      type: 'indexes/selectHistoryItem',
      payload,
    }),
  },
  selectHistoryItem: state => state.indexes.selectedHistoryItem,
}));

const indexesReducer = (state = { selectedHistoryItem: null }, action) =>
  action.type === 'indexes/selectHistoryItem' ? { ...state, selectedHistoryItem: action.payload } : state;

const renderHistory = (root, store, history) =>
  act(async () => {
    root.render(
      <Provider store={store}>
        <ThemeProvider
          theme={createTheme({
            palette: {
              split: { pressed: '#eee' },
            },
          })}
        >
          <IndexHistory history={history} />
        </ThemeProvider>
      </Provider>,
    );
  });

describe('IndexHistory selection refresh', () => {
  let container;
  let root;
  let store;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    store = configureStore({ reducer: { indexes: indexesReducer } });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('replaces the mounted in-progress selection with refreshed completed counts', async () => {
    const inProgress = {
      index_generation: 15,
      state: 'in_progress',
      indexed: 0,
      total: 0,
      updated_on: 1,
    };

    await renderHistory(root, store, [inProgress]);
    expect(selectHistoryItem(store.getState())).toMatchObject(inProgress);

    const completed = {
      ...inProgress,
      state: 'completed',
      indexed: 61,
      total: 66,
      updated_on: 2,
    };

    await renderHistory(root, store, [completed]);

    expect(selectHistoryItem(store.getState())).toMatchObject({
      index_generation: 15,
      state: 'completed',
      indexed: 61,
      total: 66,
    });
  });

  it('preserves an explicitly selected older run when the latest history changes', async () => {
    const older = {
      index_generation: 14,
      state: 'completed',
      indexed: 40,
      total: 42,
      updated_on: 1,
    };
    const latest = {
      index_generation: 15,
      state: 'completed',
      indexed: 61,
      total: 66,
      updated_on: 2,
    };

    await renderHistory(root, store, [older, latest]);
    await act(async () => {
      store.dispatch(actions.selectHistoryItem(older));
    });

    const refreshedOlder = { ...older };
    const nextLatest = {
      index_generation: 16,
      state: 'in_progress',
      indexed: 0,
      total: 0,
      updated_on: 3,
    };

    await renderHistory(root, store, [refreshedOlder, latest, nextLatest]);

    expect(selectHistoryItem(store.getState())).toMatchObject({
      index_generation: 14,
      indexed: 40,
      total: 42,
    });
  });
});
