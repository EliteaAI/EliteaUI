// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useChatSkillMention } from '../useChatSkillMention.hooks';

const shared = vi.hoisted(() => ({ calls: [], agentSkills: undefined }));

vi.mock('@/[fsd]/features/skill', () => ({
  useGetApplicationSkillsQuery: (args, options) => {
    shared.calls.push({ args, options });
    return { currentData: options?.skip ? undefined : shared.agentSkills };
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

describe('useChatSkillMention without an active agent', () => {
  const skillParticipant = (id, name, overrides = {}) => ({
    id,
    entity_name: 'skill',
    entity_meta: { id, project_id: PROJECT_ID },
    entity_settings: { version_id: id * 10, icon_meta: { url: `${name}.png` } },
    meta: { name },
    ...overrides,
  });
  const writer = skillParticipant(1, 'writer');
  const reviewer = skillParticipant(2, 'reviewer');
  const retired = skillParticipant(3, 'retired', { meta: { name: 'retired', is_available: false } });
  const agent = buildParticipant({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID });

  const listFor = (activeParticipant, participants) =>
    renderHook(() =>
      useChatSkillMention({
        chatInput: { current: null },
        activeParticipant,
        activeParticipantDetails: undefined,
        projectId: PROJECT_ID,
        participants,
      }),
    ).result.current.filteredItems.map(item => item.name);

  it("lists the conversation's runnable skill participants, except the one answering", () => {
    expect(listFor(undefined, [agent, writer, reviewer, retired])).toEqual(['reviewer', 'writer']);
    expect(listFor(writer, [agent, writer, reviewer])).toEqual(['reviewer']);
  });

  it('names the empty list after where the skills come from', () => {
    const emptyLabelFor = activeParticipant =>
      renderHook(() =>
        useChatSkillMention({
          chatInput: { current: null },
          activeParticipant,
          activeParticipantDetails: undefined,
          projectId: PROJECT_ID,
          participants: [],
        }),
      ).result.current.emptyLabel;

    expect(emptyLabelFor(agent)).toBe('No skills attached to this agent');
    expect(emptyLabelFor(undefined)).toBe('No skills in this chat');
    expect(emptyLabelFor(writer)).toBe('No skills in this chat');
  });

  it('offers no chat skills to a pipeline, whose turns never apply them', () => {
    const pipeline = {
      ...buildParticipant({ id: AGENT_ONE_ID, versionId: AGENT_ONE_VERSION_ID }),
      entity_settings: { version_id: AGENT_ONE_VERSION_ID, agent_type: 'pipeline' },
    };
    expect(listFor(pipeline, [pipeline, writer, reviewer])).toEqual([]);
  });

  it('recognises a pipeline from its resolved details', () => {
    const { result } = renderHook(() =>
      useChatSkillMention({
        chatInput: { current: null },
        activeParticipant: agent,
        activeParticipantDetails: { id: AGENT_ONE_ID, version_details: { id: 1, agent_type: 'pipeline' } },
        projectId: PROJECT_ID,
        participants: [agent, writer],
      }),
    );
    expect(result.current.filteredItems).toEqual([]);
  });

  it('offers no chat skills to an active user or toolkit', () => {
    expect(listFor({ entity_name: 'user', entity_meta: { id: 3 } }, [writer, reviewer])).toEqual([]);
  });

  it("lists an active agent's attached skills first, then the chat's skills, the attached name winning", () => {
    shared.agentSkills = {
      skills: [
        { name: 'writer', skill_id: 90 },
        { name: 'auditor', skill_id: 91 },
      ],
    };
    const { result } = renderHook(() =>
      useChatSkillMention({
        chatInput: { current: null },
        activeParticipant: agent,
        activeParticipantDetails: undefined,
        projectId: PROJECT_ID,
        participants: [agent, writer, reviewer],
      }),
    );
    expect(result.current.filteredItems.map(item => [item.name, item.group, item.skill_id])).toEqual([
      ['auditor', 'attached', 91],
      ['writer', 'attached', 90],
      ['reviewer', 'chat', 2],
    ]);
    shared.agentSkills = undefined;
  });
});
