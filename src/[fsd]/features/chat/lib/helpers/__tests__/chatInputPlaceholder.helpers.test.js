import { describe, expect, it } from 'vitest';

import { CHAT_INPUT_PLACEHOLDER, getChatInputPlaceholder } from '../chatInputPlaceholder.helpers';

const agent = {
  entity_name: 'application',
  entity_meta: { id: 11, project_id: 42 },
  meta: { name: 'Meta Name' },
};

describe('getChatInputPlaceholder', () => {
  it('names «#» when nobody but the model answers', () => {
    expect(getChatInputPlaceholder({ placeholder: '' })).toBe(CHAT_INPUT_PLACEHOLDER);
    expect(CHAT_INPUT_PLACEHOLDER).toBe('Type your message… # for assistants');
  });

  it('names «#» when the active participant is a user', () => {
    expect(
      getChatInputPlaceholder({ activeParticipant: { entity_name: 'user', meta: { name: 'Ann' } } }),
    ).toBe(CHAT_INPUT_PLACEHOLDER);
  });

  it('replies to the agent by the name of its details first', () => {
    expect(
      getChatInputPlaceholder({
        activeParticipant: agent,
        activeParticipantDetails: { id: 11, name: 'Jira Helper' },
      }),
    ).toBe('Reply to Jira Helper…');
  });

  it('ignores the details of the one who answered before until its own arrive', () => {
    expect(
      getChatInputPlaceholder({
        activeParticipant: agent,
        activeParticipantDetails: { id: 12, name: 'Previous Agent' },
      }),
    ).toBe('Reply to Meta Name…');
    expect(
      getChatInputPlaceholder({
        activeParticipant: {
          entity_name: 'llm',
          entity_meta: { model_name: 'gpt-5' },
          meta: { name: 'gpt-5' },
        },
        activeParticipantDetails: { id: 12, name: 'Previous Agent' },
      }),
    ).toBe('Reply to gpt-5…');
  });

  it('falls back to the participant meta name', () => {
    expect(getChatInputPlaceholder({ activeParticipant: agent })).toBe('Reply to Meta Name…');
  });

  it('falls back to the participant own name (a new chat)', () => {
    expect(getChatInputPlaceholder({ activeParticipant: { entity_name: 'pipeline', name: 'Nightly' } })).toBe(
      'Reply to Nightly…',
    );
  });

  it('keeps the host placeholder, the skill argument hint', () => {
    expect(
      getChatInputPlaceholder({
        placeholder: '~writer <topic>',
        activeParticipant: { entity_name: 'skill', meta: { name: 'writer' } },
      }),
    ).toBe('~writer <topic>');
  });

  it('names «#» when the participant has no name anywhere', () => {
    expect(getChatInputPlaceholder({ activeParticipant: { entity_name: 'application' } })).toBe(
      CHAT_INPUT_PLACEHOLDER,
    );
  });
});
