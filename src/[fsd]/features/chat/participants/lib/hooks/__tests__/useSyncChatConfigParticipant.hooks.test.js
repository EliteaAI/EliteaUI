// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useSyncChatConfigParticipant } from '../useSyncChatConfigParticipant.hooks';

const updateChatConfig = vi.fn();
const fetchProjectInfo = vi.fn();
const checkPermission = vi.fn(() => true);

vi.mock('@/[fsd]/features/settings/api/projectInfoApi', () => ({
  useLazyProjectInfoQuery: () => [fetchProjectInfo],
  useUpdateProjectChatConfigMutation: () => [updateChatConfig],
}));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission }),
}));

vi.mock('@/common/constants', () => ({
  PERMISSIONS: { configuration: { update: 'configuration.update' } },
  ChatParticipantType: { Applications: 'application', Pipelines: 'pipeline' },
}));

const PROJECT_ID = 1;
const APP_ID = 42;

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
    fetchProjectInfo.mockResolvedValue({
      data: makeProjectInfo([
        { entity_id: APP_ID, entity_name: 'application', name: 'Old', project_id: PROJECT_ID },
      ]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() => result.current.syncParticipant({ applicationId: APP_ID, newName: 'New' }));

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('no-ops when no participant matches the applicationId', async () => {
    fetchProjectInfo.mockResolvedValue({
      data: makeProjectInfo([
        { entity_id: 99, entity_name: 'application', name: 'Other', project_id: PROJECT_ID },
      ]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() => result.current.syncParticipant({ applicationId: APP_ID, newName: 'New' }));

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('no-ops when the matching participant belongs to a different project', async () => {
    fetchProjectInfo.mockResolvedValue({
      data: makeProjectInfo([
        { entity_id: APP_ID, entity_name: 'application', name: 'Old', project_id: 999 },
      ]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() => result.current.syncParticipant({ applicationId: APP_ID, newName: 'New' }));

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('no-ops when name, entity_name, and agent_type are already up to date', async () => {
    fetchProjectInfo.mockResolvedValue({
      data: makeProjectInfo([
        {
          entity_id: APP_ID,
          entity_name: 'application',
          name: 'Same',
          agent_type: 'react',
          project_id: PROJECT_ID,
        },
      ]),
    });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, newName: 'Same', newAgentType: 'react' }),
    );

    expect(updateChatConfig).not.toHaveBeenCalled();
  });

  it('updates name when it changed', async () => {
    const participant = {
      entity_id: APP_ID,
      entity_name: 'application',
      name: 'Old',
      agent_type: 'react',
      project_id: PROJECT_ID,
    };
    fetchProjectInfo.mockResolvedValue({ data: makeProjectInfo([participant]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, newName: 'New', newAgentType: 'react' }),
    );

    expect(updateChatConfig).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      chat_config: { participants: [{ ...participant, name: 'New' }] },
    });
  });

  it('updates agent_type and entity_name together when agent_type changed', async () => {
    const participant = {
      entity_id: APP_ID,
      entity_name: 'application',
      name: 'Agent',
      agent_type: 'react',
      project_id: PROJECT_ID,
    };
    fetchProjectInfo.mockResolvedValue({ data: makeProjectInfo([participant]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() =>
      result.current.syncParticipant({ applicationId: APP_ID, newName: 'Agent', newAgentType: 'pipeline' }),
    );

    expect(updateChatConfig).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      chat_config: {
        participants: [{ ...participant, agent_type: 'pipeline', entity_name: 'pipeline' }],
      },
    });
  });

  it('only updates the matching participant, leaving others untouched', async () => {
    const target = { entity_id: APP_ID, entity_name: 'application', name: 'Old', project_id: PROJECT_ID };
    const other = { entity_id: 99, entity_name: 'application', name: 'Other', project_id: PROJECT_ID };
    fetchProjectInfo.mockResolvedValue({ data: makeProjectInfo([target, other]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() => result.current.syncParticipant({ applicationId: APP_ID, newName: 'New' }));

    const call = updateChatConfig.mock.calls[0][0];
    expect(call.chat_config.participants).toEqual([{ ...target, name: 'New' }, other]);
  });

  it('fetches fresh data before writing to get the latest server state', async () => {
    const participant = {
      entity_id: APP_ID,
      entity_name: 'application',
      name: 'Old',
      project_id: PROJECT_ID,
    };
    fetchProjectInfo.mockResolvedValue({ data: makeProjectInfo([participant]) });

    const { result } = renderHook(() => useSyncChatConfigParticipant({ projectId: PROJECT_ID }));

    await act(() => result.current.syncParticipant({ applicationId: APP_ID, newName: 'New' }));

    expect(fetchProjectInfo).toHaveBeenCalledTimes(1);
    expect(fetchProjectInfo).toHaveBeenCalledWith({ projectId: PROJECT_ID, fields: 'chat_config' });
  });
});
