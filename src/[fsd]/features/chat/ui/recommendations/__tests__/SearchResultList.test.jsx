// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType } from '@/common/constants';
import { cleanup, render } from '@testing-library/react';

import SearchResultList from '../SearchResultList';

const shared = vi.hoisted(() => ({ calls: [] }));

vi.mock('@/hooks/chat/useParticipants', () => ({
  default: props => {
    shared.calls.push(props);
    return { participants: [], isLoading: false, isFetching: false, onLoadMore: vi.fn(), total: 0 };
  },
}));
vi.mock('../NewParticipantList', () => ({ default: () => null }));

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
