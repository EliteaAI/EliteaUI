import { describe, expect, it } from 'vitest';

import {
  completeRootHitlDecision,
  getHitlResumeGroup,
  getHitlResumeThreadId,
  getInterruptIdentity,
  getPendingHitlMessage,
  mergeHitlInterrupts,
  normalizeHitlInterrupt,
  scheduleRootHitlDecision,
  settleHitlResumeAttempt,
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
      normalizeHitlInterrupt(
        { interrupt_id: 'i1' },
        { child_thread_id: 'c1', resume_strategy: 'aggregate_child' },
      ),
      normalizeHitlInterrupt(
        { interrupt_id: 'i2' },
        { child_thread_id: 'c1', resume_strategy: 'aggregate_child' },
      ),
      normalizeHitlInterrupt(
        { interrupt_id: 'i3' },
        { child_thread_id: 'c2', resume_strategy: 'aggregate_child' },
      ),
    ];
    expect(getHitlResumeGroup(entries, entries[0]).map(item => item.interrupt_id)).toEqual(['i1', 'i2']);
  });

  it('keeps nested leaf threads while routing the aggregate through the durable child', () => {
    const first = normalizeHitlInterrupt(
      { interrupt_id: 'i1', child_thread_id: 'leaf-1', thread_id: 'leaf-1' },
      { child_thread_id: 'durable-1', resume_strategy: 'aggregate_child' },
    );
    const second = normalizeHitlInterrupt(
      { interrupt_id: 'i2', child_thread_id: 'leaf-2', thread_id: 'leaf-2' },
      { child_thread_id: 'durable-1', resume_strategy: 'aggregate_child' },
    );

    expect(first).toMatchObject({ child_thread_id: 'durable-1', thread_id: 'leaf-1' });
    expect(getHitlResumeThreadId(first)).toBe('durable-1');
    expect(getHitlResumeGroup([first, second], first).map(item => item.interrupt_id)).toEqual(['i1', 'i2']);
  });

  it('keeps an in-process leaf id inside decisions without using it as the socket route', () => {
    const interrupt = normalizeHitlInterrupt(
      {
        interrupt_id: 'i1',
        child_thread_id: 'sdk-leaf',
        thread_id: 'sdk-leaf',
        resume_strategy: 'aggregate_child',
      },
      { thread_id: 'root-worker', resume_strategy: 'root' },
    );

    expect(interrupt).toMatchObject({
      child_thread_id: 'sdk-leaf',
      thread_id: 'sdk-leaf',
      resume_strategy: 'root',
    });
    expect(getHitlResumeThreadId(interrupt)).toBe('');
  });

  it('resumes one in-process root interrupt without batching its siblings', () => {
    const first = normalizeHitlInterrupt(
      { interrupt_id: 'i1', tool_call_id: 't1' },
      { resume_strategy: 'root' },
    );
    const second = normalizeHitlInterrupt(
      { interrupt_id: 'i2', tool_call_id: 't2' },
      { resume_strategy: 'root' },
    );

    expect(getHitlResumeGroup([first, second], first)).toEqual([first]);
  });

  it('serializes independently selected root cards and skips retired queued identities', () => {
    const empty = { messageId: null, inFlightIdentity: '', decisions: [] };
    const first = { interruptId: 'i1', action: 'reject' };
    const second = { interruptId: 'i2', action: 'approve' };
    const retired = { interruptId: 'retired', action: 'reject' };

    const scheduledFirst = scheduleRootHitlDecision(empty, 'message-1', first);
    expect(scheduledFirst.status).toBe('emit');
    const scheduledRetired = scheduleRootHitlDecision(scheduledFirst.state, 'message-1', retired);
    const scheduledSecond = scheduleRootHitlDecision(scheduledRetired.state, 'message-1', second);
    expect(scheduledSecond.status).toBe('queued');
    expect(scheduleRootHitlDecision(scheduledSecond.state, 'message-1', second).status).toBe('duplicate');

    const completed = completeRootHitlDecision(scheduledSecond.state, [{ interrupt_id: 'i2' }]);
    expect(completed.nextDecision).toEqual(second);
    expect(completed.state).toMatchObject({
      messageId: 'message-1',
      inFlightIdentity: '',
      decisions: [],
    });
  });

  it('keeps pending cards until resume acceptance and restores them after rejection', () => {
    const interrupts = [
      { interrupt_id: 'i1', decided: true, hidden: true },
      { interrupt_id: 'i2', decided: true, hidden: true },
      { interrupt_id: 'i3' },
    ];

    expect(settleHitlResumeAttempt(interrupts, true)).toEqual([{ interrupt_id: 'i3' }]);
    expect(settleHitlResumeAttempt(interrupts, false)).toEqual([
      { interrupt_id: 'i1', decided: false, hidden: false },
      { interrupt_id: 'i2', decided: false, hidden: false },
      { interrupt_id: 'i3' },
    ]);
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
