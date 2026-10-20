// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunHistoryList from '../RunHistoryList';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryListItem: () => null,
  RunHistorySortableHeader: ({ headerItems }) => (
    <div data-testid="header">{headerItems.map(item => item.label).join('|')}</div>
  ),
}));

vi.mock('@/pages/Common', () => ({ ContentContainer: ({ children }) => <div>{children}</div> }));
vi.mock('@/ComponentsLib/ListInfiniteMoreLoader', () => ({ default: () => null }));

afterEach(cleanup);

describe('RunHistoryList event column title (EL-7011 US-38)', () => {
  it('EL-7011 R1.1 R1.2 shows the given event column title', () => {
    render(
      <RunHistoryList
        hasEvent
        eventColumnLabel="Execution type"
      />,
    );

    expect(screen.getByTestId('header')).toHaveTextContent('Date|Execution type|Version|Duration');
  });

  it('EL-7011 R2.2 keeps the Event title when no title is given', () => {
    render(<RunHistoryList hasEvent />);

    expect(screen.getByTestId('header')).toHaveTextContent('Date|Event|Version|Duration');
  });
});
