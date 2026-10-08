import { describe, expect, it, vi } from 'vitest';

import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import { TABS } from '../../constants/chatParticipant.constants';
import { filterFetchedForTab, getEntityName, isCatalogSkill } from '../chatParticipant.helpers';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const agent = { id: 1, participantType: ChatParticipantType.Applications, agent_type: 'openai' };
const skill = { id: 1, participantType: ChatParticipantType.Skills, project_id: 2 };
const toolkit = { id: 2, participantType: ChatParticipantType.Toolkits, type: 'github' };

describe('chat template picker helpers', () => {
  it('saves a skill under the skill entity name, not as an agent', () => {
    expect(getEntityName(skill)).toBe('skill');
    expect(getEntityName(agent)).toBe('application');
  });

  it('shows only skills on the Skills tab and no skills on the Agents tab', () => {
    const fetched = [agent, skill, toolkit];
    expect(filterFetchedForTab(fetched, TABS.SKILLS)).toEqual([skill]);
    expect(filterFetchedForTab(fetched, TABS.AGENTS)).toEqual([agent]);
  });

  it('marks only public-project skills as Catalog skills', () => {
    expect(isCatalogSkill({ entity_name: 'skill', project_id: PUBLIC_PROJECT_ID })).toBe(true);
    expect(isCatalogSkill({ entity_name: 'skill', project_id: 2 })).toBe(false);
    expect(isCatalogSkill({ entity_name: 'application', project_id: PUBLIC_PROJECT_ID })).toBe(false);
  });
});
