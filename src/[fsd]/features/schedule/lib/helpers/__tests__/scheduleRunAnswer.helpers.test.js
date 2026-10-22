import { describe, expect, it } from 'vitest';

import { ROLES } from '@/common/constants';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';

import { findRunAnswer } from '../scheduleRuns.helpers';

// EL-7011 CR-21: trimmed from the live answer of conversation 108 (schedule 47, test run 101). The answer
// message has no message-level `content`; its text is in the `text_message` item.
const ANSWER =
  'I’m the **Sched Monday Digest** for the **Schedules squad**.\n\nI can summarise it, but I don’t have the ' +
  'digest data in this chat yet.';
const CONVERSATION_108 = {
  uuid: 'a9457b90-3e74-4966-9921-fcb73f9bf5e4',
  participants: [
    { id: 1, entity_name: 'user', entity_meta: { id: 3 }, meta: {} },
    { id: 3, entity_name: 'application', entity_meta: { id: 1, project_id: 5 }, meta: {} },
  ],
  message_groups: [
    {
      id: 175,
      uuid: '6038b7de-edc7-42a3-a208-d4266647a9df',
      author_participant_id: 1,
      sent_to_id: 3,
      reply_to_id: null,
      created_at: '2026-10-21T16:39:28.881622',
      is_streaming: false,
      meta: {},
      message_items: [
        {
          id: 171,
          item_type: 'text_message',
          item_details: { content: 'Run the sched monday digest for the Schedules squad and summarise it.' },
        },
      ],
    },
    {
      id: 176,
      uuid: '6749119e-aebc-4dbe-b961-a4425c5de70c',
      author_participant_id: 3,
      sent_to_id: null,
      reply_to_id: 175,
      created_at: '2026-10-21T16:39:28.881622',
      is_streaming: false,
      meta: { is_error: false, references: [] },
      message_items: [{ id: 172, item_type: 'text_message', item_details: { content: ANSWER } }],
    },
  ],
};

describe('EL-7011 CR-21 the answer of a schedule run', () => {
  it('reads the text_message item of the last answer in the real conversation shape', () => {
    expect(findRunAnswer(convertConversationToChatHistory(CONVERSATION_108))).toBe(ANSWER);
  });

  it('falls back to the message-level content of an older answer', () => {
    const messages = [
      { role: ROLES.User, content: 'Run it' },
      { role: ROLES.Assistant, content: '## Open PRs' },
    ];
    expect(findRunAnswer(messages)).toBe('## Open PRs');
  });

  it('skips an answer without text and gives undefined when there is none', () => {
    const messages = [
      { role: ROLES.Assistant, content: 'First answer' },
      {
        role: ROLES.Assistant,
        content: '',
        message_items: [{ item_type: 'text_message', item_details: {} }],
      },
    ];
    expect(findRunAnswer(messages)).toBe('First answer');
    expect(findRunAnswer([{ role: ROLES.User, content: 'Run it' }])).toBeUndefined();
  });
});
