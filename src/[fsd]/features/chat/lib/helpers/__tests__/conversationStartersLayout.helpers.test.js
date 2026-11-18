import { describe, expect, it } from 'vitest';

import {
  getChatStartersGridLayout,
  getNewChatStartersListLayout,
} from '../conversationStartersLayout.helpers';

describe('getChatStartersGridLayout', () => {
  it.each([
    [0, 0, 0],
    [1, 1, 0],
    [4, 4, 0],
    [5, 3, 2],
    [10, 3, 7],
  ])('K=%i shows %i tiles and +%i more', (count, tileCount, moreCount) => {
    expect(getChatStartersGridLayout(count)).toEqual({ tileCount, moreCount });
  });
});

describe('getNewChatStartersListLayout', () => {
  it('shows everything up to 4', () => {
    expect(getNewChatStartersListLayout(4, false)).toEqual({ visibleCount: 4, hiddenCount: 0 });
  });

  it('collapses past 4 and expands to all', () => {
    expect(getNewChatStartersListLayout(10, false)).toEqual({ visibleCount: 4, hiddenCount: 6 });
    expect(getNewChatStartersListLayout(10, true)).toEqual({ visibleCount: 10, hiddenCount: 6 });
  });
});
