import { describe, expect, it } from 'vitest';

import { buildIndexHistoryDetailRow } from '../indexHistoryDetail.helpers';

const build = entry => buildIndexHistoryDetailRow({ entry, indexName: 'docs', initialCompletedTs: 200 });

describe('buildIndexHistoryDetailRow', () => {
  it('summarises only a run that has no transcript to show', () => {
    const entry = { state: 'scheduled_reindex', updated_on: 400 };

    expect(build(entry)).toEqual({ name: 'Reindexed by schedule — docs', entry });
  });

  it('leaves a conversation-backed run to its transcript', () => {
    expect(build({ state: 'completed', updated_on: 300, conversation_id: 9 })).toBeNull();
  });

  it('leaves a search run and an in-progress run to their transcripts', () => {
    expect(build({ state: 'run_test', updated_on: 400, conversation_id: 9 })).toBeNull();
    expect(build({ state: 'in_progress', updated_on: 400 })).toBeNull();
  });

  it('cards an interrupted run even though it has a conversation', () => {
    // It was killed before it could report anything, so the transcript holds no
    // assistant turn and the stored error is the only account of what happened.
    const entry = { state: 'interrupted', updated_on: 400, conversation_id: 9, error: 'boom' };

    expect(build(entry)).toEqual({ name: 'Interrupted — docs', entry });
  });

  it('keeps the creation event on a card, blank transcript being worse', () => {
    expect(build({ state: 'created', updated_on: 100 })?.name).toBe('Created — docs');
  });

  it('has nothing to show without a selection', () => {
    expect(build(null)).toBeNull();
    expect(build(undefined)).toBeNull();
  });
});
