// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render } from '@testing-library/react';

import GroupedCategory from '../GroupedCategory';

vi.mock('@/[fsd]/shared/ui', () => ({
  Filter: {
    CategoryFilter: ({ children }) => <div>{children}</div>,
  },
}));

describe('GroupedCategory', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders callback sections without React missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <GroupedCategory
        allCategories={['Toolkits']}
        groupedItems={{ Toolkits: [{ key: 'outlook' }] }}
        renderCategory={category => <section>{category}</section>}
      />,
    );

    const hasMissingKeyWarning = consoleError.mock.calls.some(([message]) =>
      String(message).includes('Each child in a list should have a unique "key" prop.'),
    );

    expect(hasMissingKeyWarning).toBe(false);
  });
});
