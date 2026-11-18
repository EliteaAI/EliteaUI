// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { AT_LIMIT_TOOLTIP, overLimitTooltip } from '../../helpers/conversationStarters.helpers';
import { useConversationStartersAddGate } from '../useConversationStartersAddGate.hooks';

const shared = vi.hoisted(() => ({ max: 5 }));

vi.mock('../useConversationStartersLimit.hooks', () => ({ useConversationStartersLimit: () => shared.max }));

const gate = args => renderHook(() => useConversationStartersAddGate(args)).result.current;

describe('useConversationStartersAddGate', () => {
  it('allows adding below the limit', () => {
    shared.max = 5;
    expect(gate({ count: 2 })).toEqual({
      maxStarters: 5,
      isOverLimit: false,
      disableAdd: false,
      addTooltip: '',
    });
  });

  it('blocks adding while a starter is blank, without a limit tooltip', () => {
    shared.max = 5;
    expect(gate({ count: 2, hasBlank: true })).toMatchObject({ disableAdd: true, addTooltip: '' });
  });

  it('blocks adding at the limit', () => {
    shared.max = 5;
    expect(gate({ count: 5 })).toMatchObject({
      isOverLimit: false,
      disableAdd: true,
      addTooltip: AT_LIMIT_TOOLTIP,
    });
  });

  it('marks a count above the limit as over limit', () => {
    shared.max = 4;
    expect(gate({ count: 6 })).toEqual({
      maxStarters: 4,
      isOverLimit: true,
      disableAdd: true,
      addTooltip: overLimitTooltip(4),
    });
  });
});
