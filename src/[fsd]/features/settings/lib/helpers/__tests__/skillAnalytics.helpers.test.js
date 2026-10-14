import { describe, expect, it, vi } from 'vitest';

import { buildAnalyticsSheets, fetchAllAnalyticsData } from '../analyticsExport.helpers';
import {
  skillAgentPath,
  skillDisplayName,
  skillRunAnalyticsPath,
  skillSourceLabel,
  skillTriggerLabel,
  skillVersionLabel,
} from '../skillAnalytics.helpers';

const META = {
  projectName: 'Team',
  dateFrom: '2026-10-01T00:00:00Z',
  dateTo: '2026-10-10T00:00:00Z',
  timeZone: 'UTC',
};

describe('skillRunAnalyticsPath', () => {
  const run = { conversation_id: 1701 };

  it('opens an own skill run in the skill run analytics', () => {
    expect(skillRunAnalyticsPath({ skill_id: 174, skill_project_id: 2 }, run, 2)).toBe(
      '/skills/all/174/history/analytics?history_run_id=1701',
    );
  });

  it('opens a Catalog skill run in the Catalog skill run analytics', () => {
    expect(skillRunAnalyticsPath({ skill_id: 123, skill_project_id: 1 }, run, 2)).toBe(
      '/skills/catalog/123/history/analytics?history_run_id=1701',
    );
  });

  it.each([
    ['a deleted skill', { skill_id: 1, deleted: true }, run],
    ['a run without a conversation', { skill_id: 1 }, { conversation_id: null }],
    ['no skill', null, run],
  ])('has no link for %s', (_, skill, target) => {
    expect(skillRunAnalyticsPath(skill, target, 2)).toBeNull();
  });
});

describe('skillAgentPath', () => {
  it.each([
    ['agent', '/agents/all/7'],
    ['pipeline', '/pipelines/all/7'],
  ])('links a %s to its editor', (kind, path) => {
    expect(skillAgentPath({ entity_id: 7, entity_project_id: 2, kind }, 2)).toBe(path);
  });

  it('has no link for a deleted agent', () => {
    expect(skillAgentPath({ entity_id: 7, entity_project_id: 2, deleted: true }, 2)).toBeNull();
  });

  it('has no link for a Catalog agent whose id belongs to another project', () => {
    expect(skillAgentPath({ entity_id: 7, entity_project_id: 1, kind: 'agent' }, 2)).toBeNull();
  });
});

describe('labels', () => {
  it('marks a deleted skill in its display name', () => {
    expect(skillDisplayName({ skill_name: 'Summarizer', deleted: false })).toBe('Summarizer');
    expect(skillDisplayName({ skill_name: 'Summarizer', deleted: true })).toBe('Summarizer (deleted)');
  });

  it('names the trigger, the activation and an unknown version', () => {
    expect(skillTriggerLabel('manual')).toBe('Manual');
    expect(skillTriggerLabel('webhook')).toBe('Webhook Triggers');
    expect(skillSourceLabel('load_skill')).toBe('Loaded by the agent');
    expect(skillVersionLabel(null)).toBe('Version unknown');
    expect(skillVersionLabel('base')).toBe('base');
  });
});

describe('page export with the Skills tab', () => {
  const SKILLS = {
    summary: { skills_used: 1, runs: 2, in_agent_uses: 3, cost: 0.5 },
    rows: [{ skill_name: 'pirate', deleted: true, runs: 2, in_agent_uses: 3, last_used: null }],
  };

  it('adds a Skills sheet after Agents & Pipelines only when the tab is shown', () => {
    const names = includeSkills =>
      buildAnalyticsSheets({ skills: SKILLS, meta: META, includeSkills }).map(sheet => sheet.sheetName);

    expect(names(true)).toEqual([
      'Overview',
      'Costs',
      'Tokens',
      'Agents & Pipelines',
      'Skills',
      'Tools',
      'Users',
      'Activity',
      'Health',
    ]);
    expect(names(false)).not.toContain('Skills');
  });

  it('labels a deleted skill in the sheet', () => {
    const skills = buildAnalyticsSheets({ skills: SKILLS, meta: META, includeSkills: true })[4];

    expect(skills.sections[1].rows[0].name).toBe('pirate (deleted)');
    expect(skills.sections[0].rows.map(row => row.value)).toEqual([2, 1, 3, 0.5]);
  });

  it('fetches skills only when the tab is shown', async () => {
    const endpoint = () => ({ initiate: vi.fn(args => args) });
    const endpoints = Object.fromEntries(
      [
        'projectAnalytics',
        'projectAnalyticsUsage',
        'analyticsCosts',
        'analyticsAgents',
        'analyticsTools',
        'analyticsUsers',
        'analyticsActivity',
        'analyticsSkills',
      ].map(name => [name, endpoint()]),
    );
    const dispatch = vi.fn(() => Promise.resolve({ data: 'payload' }));

    const hidden = await fetchAllAnalyticsData(dispatch, endpoints, { projectId: 2 });
    expect(endpoints.analyticsSkills.initiate).not.toHaveBeenCalled();
    expect(hidden.skills).toBeUndefined();

    const shown = await fetchAllAnalyticsData(dispatch, endpoints, { projectId: 2, includeSkills: true });
    expect(endpoints.analyticsSkills.initiate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 2 }),
    );
    expect(shown.skills).toBe('payload');
  });
});
