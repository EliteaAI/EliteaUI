import { describe, expect, it } from 'vitest';

import {
  AT_LIMIT_TOOLTIP,
  countFilled,
  getStartersLimitState,
  isConversationStartersLimitError,
  overLimitTooltip,
} from '../conversationStarters.helpers';

describe('countFilled', () => {
  it('skips blank and missing starters', () => {
    expect(countFilled(['a', '', '  ', null, 'b'])).toBe(2);
    expect(countFilled(undefined)).toBe(0);
  });
});

describe('getStartersLimitState', () => {
  it('allows adding below the limit', () => {
    expect(getStartersLimitState({ count: 3, max: 6 })).toEqual({
      allowed: 6,
      isOverLimit: false,
      canAdd: true,
      addTooltip: '',
    });
  });

  it('stops at the limit with the at-limit tooltip', () => {
    expect(getStartersLimitState({ count: 6, savedCount: 6, max: 6 })).toEqual({
      allowed: 6,
      isOverLimit: false,
      canAdd: false,
      addTooltip: AT_LIMIT_TOOLTIP,
    });
  });

  it('marks a version saved above the limit as over limit but still savable', () => {
    expect(getStartersLimitState({ count: 8, savedCount: 8, max: 5 })).toEqual({
      allowed: 8,
      isOverLimit: true,
      canAdd: false,
      addTooltip: overLimitTooltip(5),
    });
  });

  it('returns to the at-limit state once starters are removed down to the limit', () => {
    const state = getStartersLimitState({ count: 5, savedCount: 8, max: 5 });
    expect(state.isOverLimit).toBe(false);
    expect(state.canAdd).toBe(false);
    expect(state.addTooltip).toBe(AT_LIMIT_TOOLTIP);
    expect(state.allowed).toBe(8);
  });

  it('names the limit in the over-limit tooltip', () => {
    expect(overLimitTooltip(5)).toBe(
      'This version has more starters than the current limit (5). Remove some to add new ones.',
    );
  });
});

describe('isConversationStartersLimitError', () => {
  it('recognises the backend limit error', () => {
    const error = {
      status: 400,
      data: [
        {
          type: 'value_error',
          loc: ['conversation_starters'],
          msg: 'conversation_starters cannot exceed 5 items, got 6',
        },
      ],
    };
    expect(isConversationStartersLimitError(error)).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isConversationStartersLimitError({ data: [{ loc: ['name'], msg: 'x' }] })).toBe(false);
    expect(isConversationStartersLimitError({ data: { error: 'boom' } })).toBe(false);
    expect(isConversationStartersLimitError(undefined)).toBe(false);
  });
});
