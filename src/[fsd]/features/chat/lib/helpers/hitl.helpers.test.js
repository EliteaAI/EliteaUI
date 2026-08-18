import { describe, expect, it } from 'vitest';

import {
  completeRootHitlDecision,
  getHitlResumeGroup,
  getHitlResumeThreadId,
  getInterruptIdentity,
  getPendingHitlMessage,
  hasRootHitlTurnEnded,
  mergeHitlInterrupts,
  normalizeHitlInterrupt,
  reconcileRootHitlInterrupts,
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
    const empty = { messageId: null, inFlightIdentities: [], decisions: [] };
    const first = { interruptId: 'i1', action: 'reject' };
    const second = { interruptId: 'i2', action: 'approve' };
    const retired = { interruptId: 'retired', action: 'reject' };

    const scheduledFirst = scheduleRootHitlDecision(empty, 'message-1', first);
    expect(scheduledFirst.status).toBe('schedule');
    const scheduledRetired = scheduleRootHitlDecision(scheduledFirst.state, 'message-1', retired);
    const scheduledSecond = scheduleRootHitlDecision(scheduledRetired.state, 'message-1', second);
    expect(scheduledSecond.status).toBe('schedule');
    expect(scheduleRootHitlDecision(scheduledSecond.state, 'message-1', second).status).toBe('duplicate');

    const completed = completeRootHitlDecision(scheduledSecond.state, [{ interrupt_id: 'i2' }], 7);
    expect(completed.nextDecisions).toEqual([second]);
    expect(completed.state).toMatchObject({
      messageId: 'message-1',
      inFlightIdentities: ['i2'],
      requiredTurnEndRevision: 7,
      decisions: [],
    });
  });

  it('coalesces rapid pending decisions into one root resume batch', () => {
    const first = { interruptId: 'i1', action: 'reject' };
    const second = { interruptId: 'i2', action: 'approve' };
    let state = { messageId: null, inFlightIdentities: [], decisions: [] };
    state = scheduleRootHitlDecision(state, 'message-1', first).state;
    state = scheduleRootHitlDecision(state, 'message-1', second).state;

    const batch = completeRootHitlDecision(state, [{ interrupt_id: 'i1' }, { interrupt_id: 'i2' }]);
    expect(batch.nextDecisions).toEqual([first, second]);
    expect(batch.state.inFlightIdentities).toEqual(['i1', 'i2']);
  });

  it('keeps a selected durable MCP auth decision outside the sensitive interrupt list', () => {
    const auth = { interruptId: 'auth-i1', action: 'skip', guardrailType: 'mcp_auth' };
    const sensitive = { interruptId: 'delete-i1', action: 'reject' };
    let state = { messageId: null, inFlightIdentities: [], decisions: [] };
    state = scheduleRootHitlDecision(state, 'message-1', auth).state;
    state = scheduleRootHitlDecision(state, 'message-1', sensitive).state;

    const batch = completeRootHitlDecision(state, [{ interrupt_id: 'delete-i1' }]);

    expect(batch.nextDecisions).toEqual([auth, sensitive]);
    expect(batch.state.inFlightIdentities).toEqual(['auth-i1', 'delete-i1']);
  });

  it('coalesces choices made during a running batch into the next resume', () => {
    const running = {
      messageId: 'message-1',
      inFlightIdentities: ['i1'],
      decisions: [],
    };
    const second = { interruptId: 'i2', action: 'reject' };
    const third = { interruptId: 'i3', action: 'approve' };
    const queuedSecond = scheduleRootHitlDecision(running, 'message-1', second);
    const queuedThird = scheduleRootHitlDecision(queuedSecond.state, 'message-1', third);

    expect(queuedSecond.status).toBe('queued');
    expect(queuedThird.status).toBe('queued');
    const next = completeRootHitlDecision(queuedThird.state, [
      { interrupt_id: 'i2' },
      { interrupt_id: 'i3' },
    ]);
    expect(next.nextDecisions).toEqual([second, third]);
    expect(next.state.inFlightIdentities).toEqual(['i2', 'i3']);
  });

  it('does not complete a root resume before the worker turn-end report', () => {
    const waiting = {
      messageId: 'message-1',
      inFlightIdentities: ['i1'],
      requiredTurnEndRevision: 5,
      decisions: [{ interruptId: 'i2', action: 'reject' }],
    };

    expect(hasRootHitlTurnEnded(waiting, 4)).toBe(false);
    expect(hasRootHitlTurnEnded(waiting, 5)).toBe(true);
  });

  it('keeps clicked root cards hidden across an aggregate refresh', () => {
    const existing = [
      { interrupt_id: 'auth', decided: true, hidden: true },
      { interrupt_id: 'name-delete', queued: true, hidden: true },
    ];
    const incoming = [
      { interrupt_id: 'name-delete', tool_name: 'delete_file' },
      { interrupt_id: 'surname-delete', tool_name: 'delete_file' },
    ];

    expect(reconcileRootHitlInterrupts(existing, incoming)).toEqual([
      {
        interrupt_id: 'name-delete',
        tool_name: 'delete_file',
        queued: true,
        decided: false,
        hidden: true,
      },
      { interrupt_id: 'surname-delete', tool_name: 'delete_file' },
    ]);
  });

  it('keeps the interrupt array through resume acceptance and restores it after rejection', () => {
    const interrupts = [
      { interrupt_id: 'i1', decided: true, hidden: true },
      { interrupt_id: 'i2', decided: false, queued: true, hidden: true },
      { interrupt_id: 'i3' },
    ];

    expect(settleHitlResumeAttempt(interrupts, true)).toEqual(interrupts);
    expect(settleHitlResumeAttempt(interrupts, false)).toEqual([
      { interrupt_id: 'i1', decided: false, queued: false, hidden: false },
      { interrupt_id: 'i2', decided: false, queued: false, hidden: false },
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
