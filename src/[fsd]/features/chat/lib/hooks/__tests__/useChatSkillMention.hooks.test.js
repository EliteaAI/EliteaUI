// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useChatSkillMention } from '../useChatSkillMention.hooks';

const shared = vi.hoisted(() => ({ calls: [] }));

vi.mock('@/[fsd]/features/skill', () => ({
  useGetApplicationSkillsQuery: (args, options) => {
    shared.calls.push({ args, options });
    return { currentData: undefined };
  },
}));

const PROJECT_ID = 396;
const AGENT_ONE_ID = 250;
const AGENT_ONE_VERSION_ID = 300;
const BUSINESS_ANALYST_ID = 31;
const BUSINESS_ANALYST_VERSION_ID = 90;

const buildParticipant = ({ id, projectId = PROJECT_ID, versionId }) => ({
  entity_name: 'application',
  entity_meta: { id, project_id: projectId },
  entity_settings: versionId ? { version_id: versionId } : {},
});

const buildDetails = ({ id, versionId }) => ({
  id,
  version_details: { id: versionId },
});

const renderWith = (activeParticipant, activeParticipantDetails) => {
  renderHook(() =>
    useChatSkillMention({
      chatInput: { current: null },
      activeParticipant,
      activeParticipantDetails,
      projectId: PROJECT_ID,
    }),
  );
  return shared.calls.at(-1);
};

describe('useChatSkillMention', () => {
  beforeEach(() => {
    shared.calls = [];
  });

  it('queries the skills of the version stored on the participant', () => {
    const { args, options } = renderWith(
      buildParticipant({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID }),
      buildDetails({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID }),
    );

    expect(args).toEqual({ projectId: PROJECT_ID, appVersionId: AGENT_ONE_VERSION_ID });
    expect(options.skip).toBe(false);
  });

  it('falls back to the resolved details of the same participant', () => {
    const { args, options } = renderWith(
      buildParticipant({ id: AGENT_ONE_ID }),
      buildDetails({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID }),
    );

    expect(args).toEqual({ projectId: PROJECT_ID, appVersionId: AGENT_ONE_VERSION_ID });
    expect(options.skip).toBe(false);
  });

  it('skips the query while the details still describe the previous participant', () => {
    const { args, options } = renderWith(
      buildParticipant({ id: AGENT_ONE_ID }),
      buildDetails({ id: BUSINESS_ANALYST_ID, versionId: BUSINESS_ANALYST_VERSION_ID }),
    );

    expect(args.appVersionId).toBeUndefined();
    expect(options.skip).toBe(true);
  });

  it('skips the query for participants that are not agents', () => {
    const { options } = renderWith(
      { ...buildParticipant({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID }), entity_name: 'toolkit' },
      buildDetails({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID }),
    );

    expect(options.skip).toBe(true);
  });
});
