// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LazySelect from '../LazySelect';

// jsdom has no ResizeObserver, SingleSelect needs one
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const SCROLL_END_THRESHOLD_PX = 10;
const DEBOUNCE_MS = 300;

const makeOptions = count =>
  Array.from({ length: count }, (_, i) => ({ value: `v${i}`, label: `Item ${i}` }));

const buildUi = props => (
  <ThemeProvider theme={createTheme({ palette: lightPalette })}>
    <LazySelect
      label="Field"
      options={makeOptions(20)}
      total={45}
      isFetching={false}
      value=""
      displayEmpty
      withSearch
      searchString=""
      emptyPlaceholder="Nothing found"
      onValueChange={vi.fn()}
      onLoadMore={vi.fn()}
      onSearch={vi.fn()}
      {...props}
    />
  </ThemeProvider>
);

// One change event per key, with the given pause after it
const typeKeys = (field, text, pauseMs) => {
  let typed = '';
  for (const key of text) {
    typed += key;
    fireEvent.change(field, { target: { value: typed } });
    act(() => vi.advanceTimersByTime(pauseMs));
  }
};

const setup = async props => {
  const view = render(buildUi(props));
  // user-event waits on real timers, so open the list before the timers are faked
  await userEvent.setup().click(screen.getByRole('combobox'));
  vi.useFakeTimers();
  return { list: screen.getByRole('listbox'), rerender: next => view.rerender(buildUi(next)) };
};

// Scroll the list so that `distanceToEnd` px remain below the visible part.
const scrollList = (list, distanceToEnd, pauseMs = DEBOUNCE_MS) => {
  Object.defineProperty(list, 'clientHeight', { configurable: true, value: 300 });
  Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(list, 'scrollTop', {
    configurable: true,
    writable: true,
    value: 700 - distanceToEnd,
  });
  fireEvent.scroll(list);
  act(() => vi.advanceTimersByTime(pauseMs));
};

describe('LazySelect paging,', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('calls onLoadMore once when the list is scrolled to its end (TC-US25-01)', async () => {
    const onLoadMore = vi.fn();
    const { list } = await setup({ onLoadMore });

    scrollList(list, SCROLL_END_THRESHOLD_PX - 1);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not call onLoadMore when all items are loaded (TC-US25-02)', async () => {
    const onLoadMore = vi.fn();
    const { list } = await setup({ options: makeOptions(45), total: 45, onLoadMore });

    scrollList(list, 0);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not call onLoadMore when the end is more than 10 px away (TC-US25-03)', async () => {
    const onLoadMore = vi.fn();
    const { list } = await setup({ onLoadMore });

    scrollList(list, 200);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not call onLoadMore while a page is fetching (TC-US25-04)', async () => {
    const onLoadMore = vi.fn();
    const { list } = await setup({ isFetching: true, onLoadMore });

    scrollList(list, 0);
    scrollList(list, 0);
    scrollList(list, 0);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('keeps the loaded items and asks again on the next scroll after a failed page (TC-US25-05)', async () => {
    const onLoadMore = vi.fn();
    const { list, rerender } = await setup({ onLoadMore });

    scrollList(list, 0);
    rerender({ onLoadMore, isFetching: true });
    rerender({ onLoadMore, isFetching: false });
    scrollList(list, 0);

    expect(onLoadMore).toHaveBeenCalledTimes(2);
    expect(within(list).getAllByRole('option')).toHaveLength(20);
  });

  it('keeps paging when the total is unknown', async () => {
    const onLoadMore = vi.fn();
    const { list } = await setup({ total: undefined, onLoadMore });

    scrollList(list, 0);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('keeps a pending scroll when a page lands within 300 ms', async () => {
    const onLoadMore = vi.fn();
    const { list, rerender } = await setup({ onLoadMore });

    scrollList(list, 0, 0);
    rerender({ onLoadMore, options: makeOptions(40) });
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

describe('LazySelect search,', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('passes the typed text to onSearch 300 ms after the last key (TC-US25-06)', async () => {
    const onSearch = vi.fn();
    await setup({ onSearch });

    typeKeys(within(screen.getByRole('listbox')).getByRole('textbox'), 'dig', 100);
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('dig');
  });

  it('shows exactly the items the caller returns, with no local filter (TC-US25-07)', async () => {
    const { rerender } = await setup({ options: [] });
    typeKeys(within(screen.getByRole('listbox')).getByRole('textbox'), 'dig', 0);
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

    rerender({
      options: [
        { value: 'a', label: 'Digital agent' },
        { value: 'b', label: 'Planner' },
      ],
      searchString: 'dig',
    });

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map(option => option.textContent)).toEqual(['Digital agent', 'Planner']);
  });

  it('sends no onSearch call while the user keeps typing (TC-US25-08)', async () => {
    const onSearch = vi.fn();
    await setup({ onSearch });

    typeKeys(within(screen.getByRole('listbox')).getByRole('textbox'), 'abcde', 200);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('sends an empty text to onSearch at once and drops the pending text', async () => {
    const onSearch = vi.fn();
    await setup({ onSearch });
    const field = within(screen.getByRole('listbox')).getByRole('textbox');

    typeKeys(field, 'a', 0);
    fireEvent.change(field, { target: { value: '' } });
    expect(onSearch).toHaveBeenCalledWith('');
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('shows the search text the caller passes after a reset', async () => {
    const { rerender } = await setup({ searchString: 'dig' });

    rerender({ searchString: '' });

    expect(within(screen.getByRole('listbox')).getByRole('textbox')).toHaveValue('');
  });
});

describe('LazySelect loading row and empty text,', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the loading row while a page loads (TC-US25-13)', async () => {
    const { list } = await setup({ isFetching: true });

    expect(within(list).getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the empty text when no item matches and nothing loads (TC-US25-14)', async () => {
    const { list } = await setup({ options: [], total: 0 });

    expect(within(list).getByText('Nothing found')).toBeInTheDocument();
  });

  it('shows no empty text while the list loads (TC-US25-15)', async () => {
    const { list } = await setup({ options: [], total: 0, isFetching: true });

    expect(within(list).queryByText('Nothing found')).not.toBeInTheDocument();
  });

  it('shows no loading row and no empty text for an idle list with items (TC-US25-16)', async () => {
    const { list } = await setup();

    expect(within(list).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(within(list).queryByText('Nothing found')).not.toBeInTheDocument();
  });
});
