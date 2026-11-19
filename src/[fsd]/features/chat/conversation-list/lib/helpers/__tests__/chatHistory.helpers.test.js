import { describe, expect, it } from 'vitest';

import { applyPrivacyToLists, mergeDateGroupsFirstPage } from '../chatHistory.helpers';

const chat = (id, updatedAt, extra = {}) => ({ id, updated_at: updatedAt, ...extra });

describe('mergeDateGroupsFirstPage', () => {
  const serverPage = {
    name: 'older',
    total: 30,
    offset: 2,
    conversations: [chat(1, '2026-11-10'), chat(2, '2026-11-09')],
  };

  it('keeps the loaded chats past the new first page, with the loaded offset', () => {
    const loaded = [
      {
        name: 'older',
        total: 30,
        offset: 4,
        exhausted: false,
        conversations: [
          chat(1, '2026-11-10'),
          chat(2, '2026-11-09'),
          chat(3, '2026-11-08'),
          chat(4, '2026-11-07'),
        ],
      },
    ];

    const [merged] = mergeDateGroupsFirstPage(loaded, [serverPage]);

    expect(merged.conversations.map(c => c.id)).toEqual([1, 2, 3, 4]);
    expect(merged.offset).toBe(4);
    expect(merged.total).toBe(30);
  });

  it('drops a loaded chat that is missing inside the new page window', () => {
    const loaded = [
      {
        name: 'older',
        offset: 3,
        conversations: [chat(1, '2026-11-10'), chat(9, '2026-11-09T12:00'), chat(3, '2026-11-08')],
      },
    ];

    const [merged] = mergeDateGroupsFirstPage(loaded, [serverPage]);

    expect(merged.conversations.map(c => c.id)).toEqual([1, 2, 3]);
  });

  it('does not repeat a chat that is in the new page', () => {
    const loaded = [{ name: 'older', conversations: [chat(2, '2026-11-09'), chat(3, '2026-11-08')] }];

    const [merged] = mergeDateGroupsFirstPage(loaded, [serverPage]);

    expect(merged.conversations.map(c => c.id)).toEqual([1, 2, 3]);
  });

  it('returns the server page when it already holds the whole group', () => {
    const complete = { ...serverPage, total: 2 };
    const loaded = [{ name: 'older', conversations: [chat(3, '2026-11-08')] }];

    expect(mergeDateGroupsFirstPage(loaded, [complete])[0]).toBe(complete);
  });

  it('leaves playback copies out of the kept tail', () => {
    const loaded = [{ name: 'older', conversations: [chat(3, '2026-11-08', { isPlayback: true })] }];

    expect(mergeDateGroupsFirstPage(loaded, [serverPage])[0]).toBe(serverPage);
  });

  it('falls back to created_at when a chat has no updated_at', () => {
    const loaded = [{ name: 'older', conversations: [{ id: 3, created_at: '2026-11-01' }] }];

    expect(mergeDateGroupsFirstPage(loaded, [serverPage])[0].conversations.map(c => c.id)).toEqual([1, 2, 3]);
  });
});

describe('applyPrivacyToLists', () => {
  it('sets is_private on the chat in flat lists and inside folders', () => {
    const { updateConversations, updateFolders } = applyPrivacyToLists({
      conversationId: 2,
      isPrivate: false,
    });

    expect(updateConversations([{ id: 1 }, { id: 2, is_private: true }])).toEqual([
      { id: 1 },
      { id: 2, is_private: false },
    ]);
    expect(updateFolders([{ id: 7, conversations: [{ id: 2, is_private: true }] }])).toEqual([
      { id: 7, conversations: [{ id: 2, is_private: false }] },
    ]);
  });
});
