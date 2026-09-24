// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useSyncChatConfigParticipant } from '../useSyncChatConfigParticipant.hooks';

const updateChatConfig = vi.fn();
const refetch = vi.fn();
const checkPermission = vi.fn(() => true);

vi.mock('@/[fsd]/features/settings/api/projectInfoApi', () => ({
  useProjectInfoQuery: () => ({ refetch }),
  useUpdateProjectChatConfigMutation: () => [updateChatConfig],
}));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission }),
}));

vi.mock('@/common/constants', () => ({
  PERMISSIONS: { configuration: { update: 'configuration.update' } },
}));

const PROJECT_ID = 1;
const APP_ID = 42;
const ENTITY_NAME = 'application';

const makeProjectInfo = (participants = []) => ({
  chat_config: { participants },
});

describe('useSyncChatConfigParticipant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkPermission.mockReturnValue(true);
  });

  it('no-ops when the user lacks configuration.update permission', async () => {
    checkPermission.mockReturnValue(false);
    refetch.mockResolvedValue({
      data: makeProjectInfo([{ entity_id: APP_ID, entity_name: ENTITY_NAME, name: 'Old' }]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, entityName: ENTITY_NAME, newName: 'New' }),
    );

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('no-ops when no participant matches the applicationId + entityName', async () => {
    refetch.mockResolvedValue({
      data: makeProjectInfo([{ entity_id: 99, entity_name: ENTITY_NAME, name: 'Other' }]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, entityName: ENTITY_NAME, newName: 'New' }),
    );

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('no-ops when name and agent_type are already up to date', async () => {
    refetch.mockResolvedValue({
      data: makeProjectInfo([
        { entity_id: APP_ID, entity_name: ENTITY_NAME, name: 'Same', agent_type: 'react' },
      ]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({
        applicationId: APP_ID,
        entityName: ENTITY_NAME,
        newName: 'Same',
        newAgentType: 'react',
      }),
    );

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('updates name when it changed', async () => {
    const participant = {
      entity_id: APP_ID,
      entity_name: ENTITY_NAME,
      name: 'Old',
      agent_type: 'react',
      project_id: PROJECT_ID,
    };
    refetch.mockResolvedValue({ data: makeProjectInfo([participant]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({
        applicationId: APP_ID,
        entityName: ENTITY_NAME,
        newName: 'New',
        newAgentType: 'react',
      }),
    );

    expect(updateChatConfig).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      chat_config: {
        participants: [{ ...participant, name: 'New' }],
      },
    });
  });

  it('updates agent_type when it changed', async () => {
    const participant = {
      entity_id: APP_ID,
      entity_name: ENTITY_NAME,
      name: 'Agent',
      agent_type: 'react',
      project_id: PROJECT_ID,
    };
    refetch.mockResolvedValue({ data: makeProjectInfo([participant]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({
        applicationId: APP_ID,
        entityName: ENTITY_NAME,
        newName: 'Agent',
        newAgentType: 'pipeline',
      }),
    );

    expect(updateChatConfig).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      chat_config: {
        participants: [{ ...participant, agent_type: 'pipeline' }],
      },
    });
  });

  it('only updates matching participant, leaving others untouched', async () => {
    const target = { entity_id: APP_ID, entity_name: ENTITY_NAME, name: 'Old' };
    const other = { entity_id: 99, entity_name: ENTITY_NAME, name: 'Other' };
    refetch.mockResolvedValue({ data: makeProjectInfo([target, other]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, entityName: ENTITY_NAME, newName: 'New' }),
    );

    const call = updateChatConfig.mock.calls[0][0];
    expect(call.chat_config.participants).toEqual([{ ...target, name: 'New' }, other]);
  });

  it('refetches before writing to get the latest server state', async () => {
    const participant = { entity_id: APP_ID, entity_name: ENTITY_NAME, name: 'Old' };
    refetch.mockResolvedValue({ data: makeProjectInfo([participant]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, entityName: ENTITY_NAME, newName: 'New' }),
    );

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
