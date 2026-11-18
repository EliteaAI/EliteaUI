// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType } from '@/common/constants';
import { cleanup, renderHook } from '@testing-library/react';

import { useParticipantItem } from '../useParticipantItem.hooks';

const details = vi.hoisted(() => ({ status: {} }));

vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }));
vi.mock('@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext', () => ({
  useParticipantDetailsContext: () => ({
    getDetails: () => undefined,
    getParticipantStatus: () => details.status,
  }),
}));
vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({
  useParticipantEntityIcon: () => undefined,
}));
vi.mock('@/[fsd]/widgets/support-assistant', () => ({
  useEliteaAssistantRef: () => ({ current: { showPopup: vi.fn() } }),
}));
vi.mock('@/hooks/useNavBlocker', () => ({
  default: () => ({ isEditingAgent: false, isEditingPipeline: false, isEditingToolkit: false }),
}));

const renderActive = status => {
  details.status = status;
  const onClickItem = vi.fn();
  renderHook(() =>
    useParticipantItem({
      participant: {
        id: 222,
        entity_name: ChatParticipantType.Applications,
        entity_meta: { id: 222, project_id: 2 },
        meta: {},
      },
      isActive: true,
      onClickItem,
    }),
  );
  return onClickItem;
};

describe('useParticipantItem deselect of an active participant (#7585)', () => {
  afterEach(() => {
    details.status = {};
    cleanup();
  });

  it('keeps an active participant that only needs a sign-in selected', () => {
    expect(renderActive({ hasMisconfigurationErrors: true, signInOnly: true })).not.toHaveBeenCalled();
  });

  it('deselects an active participant with a misconfiguration a sign-in will not clear', () => {
    expect(renderActive({ hasMisconfigurationErrors: true, signInOnly: false })).toHaveBeenCalledWith(
      undefined,
    );
  });
});
