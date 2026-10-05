// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook, waitFor } from '@testing-library/react';

import { useParticipantWelcomeMessage } from '../useParticipantWelcomeMessage.hooks';

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

describe('useParticipantWelcomeMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['no participant', undefined],
    ['a model', { entity_name: 'llm', entity_meta: { model_name: 'gpt' } }],
    ['a toolkit', { entity_name: 'toolkit', entity_meta: { id: 6 } }],
  ])('returns nothing for %s', (_, participant) => {
    const { result } = renderHook(() => useParticipantWelcomeMessage(participant));

    expect(result.current).toEqual({ key: null, message: '', isLoading: false });
    expect(fetchOriginalDetails).not.toHaveBeenCalled();
  });

  it('uses the default version details when the participant is pinned to it', async () => {
    fetchOriginalDetails.mockResolvedValue({ version_details: { id: 10, welcome_message: 'Hi from 10' } });

    const { result } = renderHook(() => useParticipantWelcomeMessage(makeAgent(1, 10)));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.message).toBe('Hi from 10');
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

    const { result } = renderHook(() => useParticipantWelcomeMessage(makeAgent(1, 11)));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.message).toBe('Hi from v1');
    expect(fetchOriginalVersionDetails).toHaveBeenCalledWith('application', 1, 11, 1, 'v1');
  });

  it('uses locally known version_details after a version switch without fetching', async () => {
    const participant = makeAgent(1, 12, { version_details: { id: 12, welcome_message: 'Switched' } });

    const { result } = renderHook(() => useParticipantWelcomeMessage(participant));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.message).toBe('Switched');
    expect(fetchOriginalDetails).not.toHaveBeenCalled();
  });

  it('re-resolves on a version switch, keeping the previous greeting meanwhile', async () => {
    fetchOriginalDetails.mockResolvedValue({ version_details: { id: 10, welcome_message: 'Old' } });

    const { result, rerender } = renderHook(({ participant }) => useParticipantWelcomeMessage(participant), {
      initialProps: { participant: makeAgent(1, 10) },
    });
    await waitFor(() => expect(result.current.message).toBe('Old'));

    rerender({ participant: makeAgent(1, 11, { version_details: { id: 11, welcome_message: 'New' } }) });
    expect(result.current).toMatchObject({ isLoading: true, message: 'Old' });

    await waitFor(() => expect(result.current).toMatchObject({ isLoading: false, message: 'New' }));
  });

  it("never shows another participant's greeting while switching agents", async () => {
    fetchOriginalDetails.mockImplementation(async (_type, id) => ({
      version_details: { id: id * 10, welcome_message: `Hi from ${id}` },
    }));

    const { result, rerender } = renderHook(({ participant }) => useParticipantWelcomeMessage(participant), {
      initialProps: { participant: makeAgent(1, 10) },
    });
    await waitFor(() => expect(result.current.message).toBe('Hi from 1'));

    rerender({ participant: makeAgent(2, 20) });
    expect(result.current).toMatchObject({ isLoading: true, message: '' });

    await waitFor(() => expect(result.current.message).toBe('Hi from 2'));
  });

  it.each([
    ['blank', async () => ({ version_details: { id: 10, welcome_message: '   ' } })],
    [
      'failing',
      async () => {
        throw new Error('boom');
      },
    ],
  ])('returns an empty message for a %s welcome', async (_, impl) => {
    fetchOriginalDetails.mockImplementation(impl);

    const { result } = renderHook(() => useParticipantWelcomeMessage(makeAgent(1, 10)));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.message).toBe('');
  });
});
