import { describe, expect, it } from 'vitest';

import { resolveReindexStubAction } from '../reindexStub.helpers';

const BASELINE = 1_000;

const snapshot = over => ({
  observedAt: 100,
  startedTimeStamp: 200,
  fulfilledTimeStamp: 300,
  serverRow: { stale: false, metadata: { state: 'in_progress', created_on: BASELINE + 60 } },
  baselineCreatedOn: BASELINE,
  serverSawRun: false,
  ...over,
});

const row = (state, created_on, over = {}) => ({
  stale: false,
  metadata: { state, created_on },
  ...over,
});

describe('resolveReindexStubAction', () => {
  it('does nothing before a qualifying post-click snapshot exists', () => {
    expect(resolveReindexStubAction(snapshot({ observedAt: undefined }))).toBeNull();
    expect(resolveReindexStubAction(snapshot({ startedTimeStamp: undefined }))).toBeNull();
    expect(resolveReindexStubAction(snapshot({ fulfilledTimeStamp: undefined }))).toBeNull();
    expect(resolveReindexStubAction(snapshot({ startedTimeStamp: 50 }))).toBeNull();
    expect(resolveReindexStubAction(snapshot({ fulfilledTimeStamp: 150 }))).toBeNull();
  });

  it('expires when the row is gone or the backend marks it stale', () => {
    expect(resolveReindexStubAction(snapshot({ serverRow: undefined }))).toBe('expire');
    expect(resolveReindexStubAction(snapshot({ serverRow: { stale: true, metadata: {} } }))).toBe('expire');
  });

  it('arms once the server confirms a run newer than the clicked row', () => {
    expect(resolveReindexStubAction(snapshot())).toBe('arm');
  });

  it('does not latch onto the previous run still showing in_progress', () => {
    expect(resolveReindexStubAction(snapshot({ serverRow: row('in_progress', BASELINE) }))).toBeNull();
  });

  it('keeps the stub for a leftover terminal state the server has not replaced yet', () => {
    // Ending the stub here would unmount the runner mid-run.
    expect(resolveReindexStubAction(snapshot({ serverRow: row('interrupted', BASELINE) }))).toBeNull();
  });

  it('expires on a terminal state once the server saw the run', () => {
    for (const state of ['interrupted', 'failed', 'completed', 'cancelled']) {
      expect(
        resolveReindexStubAction(snapshot({ serverRow: row(state, BASELINE), serverSawRun: true })),
      ).toBe('expire');
    }
  });

  it('expires on a terminal row created after the clicked one, even unseen in progress', () => {
    // An unfocused tab polls nothing, so the run is only ever seen already terminal.
    for (const state of ['interrupted', 'failed', 'completed', 'cancelled']) {
      expect(
        resolveReindexStubAction(snapshot({ serverRow: row(state, BASELINE + 60), serverSawRun: false })),
      ).toBe('expire');
    }
  });

  it('falls back to the arm latch when created_on is not comparable', () => {
    const legacyRow = { stale: false, metadata: { state: 'in_progress' } };
    expect(resolveReindexStubAction(snapshot({ serverRow: legacyRow, baselineCreatedOn: undefined }))).toBe(
      'arm',
    );
    expect(
      resolveReindexStubAction(
        snapshot({
          serverRow: { stale: false, metadata: { state: 'interrupted' } },
          baselineCreatedOn: undefined,
          serverSawRun: false,
        }),
      ),
    ).toBeNull();
  });

  it('keeps arming while the new run stays in progress', () => {
    expect(resolveReindexStubAction(snapshot({ serverSawRun: true }))).toBe('arm');
  });
});
