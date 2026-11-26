import { describe, expect, it } from 'vitest';

import { CHAT_INPUT_PLACEHOLDER, getChatInputPlaceholder } from '../chatInputPlaceholder.helpers';

const agent = { entity_name: 'application', meta: { name: 'Meta Name' } };

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
        activeParticipantDetails: { name: 'Jira Helper' },
      }),
    ).toBe('Reply to Jira Helper…');
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
