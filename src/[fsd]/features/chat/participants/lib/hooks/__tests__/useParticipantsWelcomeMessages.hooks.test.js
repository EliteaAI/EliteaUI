// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook, waitFor } from '@testing-library/react';

import { useParticipantsWelcomeMessages } from '../useParticipantsWelcomeMessages.hooks';

const fetchOriginalDetails = vi.fn();
const fetchOriginalVersionDetails = vi.fn();

vi.mock('@/[fsd]/features/chat/participants/lib/hooks/useFetchParticipantDetails.hooks', () => ({
  useFetchParticipantDetails: () => ({ fetchOriginalDetails, fetchOriginalVersionDetails }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 1,
}));

const makeAgent = (id, versionId, extra = {}) => ({
  id: `p${id}`,
  entity_name: 'application',
  entity_meta: { id, project_id: 1 },
  entity_settings: { version_id: versionId },
  ...extra,
});

describe('useParticipantsWelcomeMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores models, users and toolkits', async () => {
    const participants = [
      { entity_name: 'llm', entity_meta: { model_name: 'gpt' } },
      { entity_name: 'user', entity_meta: { id: 5 } },
      { entity_name: 'toolkit', entity_meta: { id: 6 } },
    ];
    const { result } = renderHook(() => useParticipantsWelcomeMessages(participants));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(fetchOriginalDetails).not.toHaveBeenCalled();
  });

  it('uses the default version details when the participant is pinned to it', async () => {
    fetchOriginalDetails.mockResolvedValue({ version_details: { id: 10, welcome_message: 'Hi from 10' } });

    const { result } = renderHook(() => useParticipantsWelcomeMessages([makeAgent(1, 10)]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries.map(e => e.message)).toEqual(['Hi from 10']);
    expect(fetchOriginalVersionDetails).not.toHaveBeenCalled();
  });

  it('fetches the pinned version when it differs from the default one', async () => {
    fetchOriginalDetails.mockResolvedValue({
      version_details: { id: 10, welcome_message: 'Hi from 10' },
      versions: [
        { id: 10, name: 'latest' },
        { id: 11, name: 'v1' },
      ],
    });
    fetchOriginalVersionDetails.mockResolvedValue({ id: 11, welcome_message: 'Hi from v1' });

    const { result } = renderHook(() => useParticipantsWelcomeMessages([makeAgent(1, 11)]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries.map(e => e.message)).toEqual(['Hi from v1']);
    expect(fetchOriginalVersionDetails).toHaveBeenCalledWith('application', 1, 11, 1, 'v1');
  });

  it('uses locally known version_details after a version switch without fetching', async () => {
    const participant = makeAgent(1, 12, { version_details: { id: 12, welcome_message: 'Switched' } });

    const { result } = renderHook(() => useParticipantsWelcomeMessages([participant]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries.map(e => e.message)).toEqual(['Switched']);
    expect(fetchOriginalDetails).not.toHaveBeenCalled();
  });

  it('re-resolves when a participant switches version', async () => {
    fetchOriginalDetails.mockResolvedValue({ version_details: { id: 10, welcome_message: 'Old' } });

    const { result, rerender } = renderHook(
      ({ participants }) => useParticipantsWelcomeMessages(participants),
      { initialProps: { participants: [makeAgent(1, 10)] } },
    );
    await waitFor(() => expect(result.current.entries.map(e => e.message)).toEqual(['Old']));

    rerender({
      participants: [makeAgent(1, 11, { version_details: { id: 11, welcome_message: 'New' } })],
    });

    await waitFor(() => expect(result.current.entries.map(e => e.message)).toEqual(['New']));
  });

  it('drops participants without a welcome message or whose fetch fails', async () => {
    fetchOriginalDetails.mockImplementation(async (_type, id) => {
      if (id === 2) throw new Error('boom');
      return { version_details: { id: id * 10, welcome_message: id === 1 ? 'Hello' : '   ' } };
    });

    const { result } = renderHook(() =>
      useParticipantsWelcomeMessages([makeAgent(1, 10), makeAgent(2, 20), makeAgent(3, 30)]),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries.map(e => e.message)).toEqual(['Hello']);
  });
});
