// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType } from '@/common/constants';
import { cleanup, render } from '@testing-library/react';

import SearchResultList from '../SearchResultList';

const shared = vi.hoisted(() => ({ calls: [], participants: [], listed: [] }));

vi.mock('@/hooks/chat/useParticipants', () => ({
  default: props => {
    shared.calls.push(props);
    return {
      participants: shared.participants,
      isLoading: false,
      isFetching: false,
      onLoadMore: vi.fn(),
      total: shared.participants.length + 10,
    };
  },
}));
vi.mock('../NewParticipantList', () => ({
  default: props => {
    shared.listed.push(props);
    return null;
  },
}));

describe('SearchResultList', () => {
  afterEach(() => cleanup());

  it('searches skills alongside agents and pipelines, honouring the private trigger', () => {
    render(
      <SearchResultList
        query="writer"
        excludePublic
        onSelectParticipant={vi.fn()}
      />,
    );

    expect(shared.calls.at(-1)).toMatchObject({
      query: 'writer',
      excludePublic: true,
      types: [ChatParticipantType.Applications, ChatParticipantType.Pipelines, ChatParticipantType.Skills],
    });
  });
});

describe('SearchResultList for someone who may not change the participants (#7757)', () => {
  afterEach(() => {
    cleanup();
    shared.participants = [];
  });

  it('offers only the agents already in the chat', () => {
    shared.participants = [
      { id: 7, participantId: 'application_7_5', name: 'Writer' },
      { id: 8, participantId: 'application_8_5', name: 'Reviewer' },
    ];
    render(
      <SearchResultList
        query="r"
        onlyExisting
        existingParticipants={[{ entity_name: 'application', entity_meta: { id: 7, project_id: 5 } }]}
        onSelectParticipant={vi.fn()}
      />,
    );

    const listed = shared.listed.at(-1);
    expect(listed.participants.map(item => item.id)).toEqual([7]);
    expect(listed.total).toBe(1);
  });
});
