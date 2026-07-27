import { describe, expect, it } from 'vitest';

import {
  getHitlResumeGroup,
  getInterruptIdentity,
  getPendingHitlMessage,
  mergeHitlInterrupts,
  normalizeHitlInterrupt,
} from './hitl.helpers';

describe('HITL helpers', () => {
  it('preserves two interrupts from one child by interrupt id', () => {
    const first = normalizeHitlInterrupt(
      { interrupt_id: 'i1', tool_call_id: 't1' },
      { child_thread_id: 'c' },
    );
    const second = normalizeHitlInterrupt(
      { interrupt_id: 'i2', tool_call_id: 't2' },
      { child_thread_id: 'c' },
    );
    expect(mergeHitlInterrupts([first], [second])).toHaveLength(2);
  });

  it('keeps a missing backend interrupt id absent and uses only a local fallback key', () => {
    const interrupt = normalizeHitlInterrupt({ tool_call_id: 't1' });
    expect(interrupt.interrupt_id).toBe('');
    expect(getInterruptIdentity(interrupt)).toBe(JSON.stringify(['', 't1']));
    expect(getInterruptIdentity({})).toBe('');
  });

  it('buffers all decisions for one aggregate child but not another child', () => {
    const entries = [
      normalizeHitlInterrupt({ interrupt_id: 'i1' }, { child_thread_id: 'c1' }),
      normalizeHitlInterrupt({ interrupt_id: 'i2' }, { child_thread_id: 'c1' }),
      normalizeHitlInterrupt({ interrupt_id: 'i3' }, { child_thread_id: 'c2' }),
    ];
    expect(getHitlResumeGroup(entries, entries[0]).map(item => item.interrupt_id)).toEqual(['i1', 'i2']);
  });

  it('selects only actionable HITL state on the current assistant turn', () => {
    const stale = { id: 'old', role: 'assistant', hitlInterrupt: { interrupt_id: 'old' } };
    expect(getPendingHitlMessage([stale])).toBe(stale);
    expect(getPendingHitlMessage([stale, { id: 'user', role: 'user' }])).toBeUndefined();
    expect(
      getPendingHitlMessage([stale, { id: 'current', role: 'assistant', content: 'done' }]),
    ).toBeUndefined();
  });
});
