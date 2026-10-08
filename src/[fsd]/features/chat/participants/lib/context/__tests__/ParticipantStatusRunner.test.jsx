// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { cleanup, render } from '@testing-library/react';

import ParticipantStatusRunner from '../ParticipantStatusRunner';

vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({
  useParticipantValidation: () => ({ hasMisconfigurationErrors: false }),
  useParticipantMcpStatus: () => ({}),
  useParticipantToolAvailability: () => ({ someToolsAreUnavailable: false, blockedToolkitNames: [] }),
  useParticipantSpOAuth: () => ({}),
  useParticipantOpenApiOAuth: () => ({}),
}));

const skill = (projectId, overrides = {}) => ({
  entity_name: ChatParticipantType.Skills,
  entity_meta: { id: 5, project_id: projectId },
  entity_settings: { version_id: 41 },
  meta: { name: 'writer', is_available: true },
  ...overrides,
});

const statusOf = (participant, originalDetails, hasFetchedDetails = true) => {
  const setParticipantStatus = vi.fn();
  render(
    <ParticipantStatusRunner
      cacheKey="key"
      participant={participant}
      originalDetails={originalDetails}
      hasFetchedDetails={hasFetchedDetails}
      setParticipantStatus={setParticipantStatus}
      updateDetails={vi.fn()}
    />,
  );
  return setParticipantStatus.mock.calls.at(-1)[1];
};

describe('ParticipantStatusRunner skill states', () => {
  afterEach(() => cleanup());

  it('keeps an available skill enabled and error free', () => {
    const status = statusOf(skill(2), { id: 5, versions: [{ id: 41 }] });

    expect(status).toMatchObject({
      hasError: false,
      shouldDisableThisItem: false,
      isSkillGone: false,
      isSkillVersionUnavailable: false,
    });
  });

  it('flags a skill without any version left as gone, not as a published agent', () => {
    const status = statusOf(skill(PUBLIC_PROJECT_ID), {});

    expect(status).toMatchObject({ hasError: true, isSkillGone: true, isPublishedAgentGone: false });
  });

  it('flags a pinned version that is no longer listed', () => {
    const status = statusOf(skill(PUBLIC_PROJECT_ID), { id: 5, versions: [{ id: 42 }] });

    expect(status).toMatchObject({
      hasError: true,
      isSkillVersionUnavailable: true,
      isVersionUnavailable: false,
    });
  });

  it('trusts the backend availability before the details arrive', () => {
    const status = statusOf(skill(2, { meta: { name: 'writer', is_available: false } }), {}, false);

    expect(status).toMatchObject({ hasError: true, isSkillVersionUnavailable: true, isSkillGone: false });
  });
});
