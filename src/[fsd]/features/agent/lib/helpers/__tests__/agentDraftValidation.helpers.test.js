import { describe, expect, it } from 'vitest';

import { validateAgentDraft } from '../agentDraftValidation.helpers';

const draft = starters => ({ name: 'Agent', description: 'Does things', conversation_starters: starters });

describe('validateAgentDraft starters limit', () => {
  it('uses the limit it is given', () => {
    expect(validateAgentDraft(draft(['a', 'b', 'c']), 2).conversation_starters).toBe(
      'Maximum 2 conversation starters allowed',
    );
    expect(validateAgentDraft(draft(['a', 'b', 'c']), 10).conversation_starters).toBeUndefined();
  });

  it('falls back to 4 and ignores blank starters', () => {
    expect(validateAgentDraft(draft(['a', 'b', 'c', 'd', ''])).conversation_starters).toBeUndefined();
    expect(validateAgentDraft(draft(['a', 'b', 'c', 'd', 'e'])).conversation_starters).toBe(
      'Maximum 4 conversation starters allowed',
    );
  });
});
