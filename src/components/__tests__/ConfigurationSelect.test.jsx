// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render } from '@testing-library/react';

import ConfigurationSelect from '../ConfigurationSelect';

// EL-7011 US-25: ConfigurationSelect pages on scroll, searches on the server and lists the manual and
// create options first. These tests pin that behavior so the move to the shared lazy select keeps it.

const DEBOUNCE_MS = 300;
const PERSONAL_PROJECT_ID = 'personal-project';

let singleSelectProps;

vi.mock('@/[fsd]/shared/ui', () => ({
  Select: {
    SingleSelect: props => {
      singleSelectProps = props;
      return <div data-testid="single-select" />;
    },
  },
}));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: PERSONAL_PROJECT_ID } }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 'project-1',
}));

const CONFIGURATIONS = [
  { project_id: 'project-1', settings: { title: 'alpha' }, config: {} },
  { project_id: PERSONAL_PROJECT_ID, settings: { title: 'beta' }, config: {} },
];

const renderSelect = (props = {}) =>
  render(
    <ConfigurationSelect
      configurations={CONFIGURATIONS}
      onLoadMore={vi.fn()}
      setQuery={vi.fn()}
      onSelectConfiguration={vi.fn()}
      isFetching={false}
      {...props}
    />,
  );

const scrollEvent = ({ scrollTop, clientHeight, scrollHeight }) => ({
  target: { scrollTop, clientHeight, scrollHeight },
});

describe('ConfigurationSelect EL-7011', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('R3.1 EL-7011 calls onLoadMore once when the list is scrolled to the end', () => {
    const onLoadMore = vi.fn();
    renderSelect({ onLoadMore });

    singleSelectProps.onScroll(scrollEvent({ scrollTop: 500, clientHeight: 200, scrollHeight: 700 }));
    expect(onLoadMore).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('R3.1 EL-7011 does not call onLoadMore before the end or while fetching', () => {
    const onLoadMore = vi.fn();
    const { rerender } = renderSelect({ onLoadMore });

    singleSelectProps.onScroll(scrollEvent({ scrollTop: 100, clientHeight: 200, scrollHeight: 700 }));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    expect(onLoadMore).not.toHaveBeenCalled();

    rerender(
      <ConfigurationSelect
        configurations={CONFIGURATIONS}
        onLoadMore={onLoadMore}
        setQuery={vi.fn()}
        onSelectConfiguration={vi.fn()}
        isFetching
      />,
    );
    singleSelectProps.onScroll(scrollEvent({ scrollTop: 500, clientHeight: 200, scrollHeight: 700 }));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('R3.2 EL-7011 searches on the server through setQuery', () => {
    const setQuery = vi.fn();
    renderSelect({ setQuery, query: 'al' });

    expect(singleSelectProps.withSearch).toBe(true);
    expect(singleSelectProps.searchFilterMode).toBe('remote');
    expect(singleSelectProps.searchString).toBe('al');
    expect(singleSelectProps.onSearch).toBe(setQuery);
  });

  it('R3.3 EL-7011 lists manual and create options before the saved configurations', () => {
    renderSelect();

    expect(singleSelectProps.options.map(option => option.value)).toEqual([
      'Manual_Title',
      'Create_Personal_Title',
      'Create_Project_Title',
      'false_alpha',
      'true_beta',
    ]);
  });
});
