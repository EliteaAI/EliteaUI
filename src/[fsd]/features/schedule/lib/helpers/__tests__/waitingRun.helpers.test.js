import { describe, expect, it } from 'vitest';

import {
  describeRunNoteActions,
  findWaitingRun,
  formatTool,
  getPausedMoreCount,
  getPausedTools,
  getRunDeciderId,
  getRunNoteActions,
  getWaitingRunNeed,
  hasMissingCredential,
  isDeciderStarter,
} from '../waitingRun.helpers';

describe('getWaitingRunNeed', () => {
  it('reads the structured fields of the paused event', () => {
    expect(
      getWaitingRunNeed({ kind: 'paused', need: 'credential', toolkit: 'GitHub', credential: 'gh-main' }),
    ).toEqual({ need: 'credential', toolkit: 'GitHub', credential: 'gh-main' });
    expect(getWaitingRunNeed({ kind: 'paused', need: 'sign_in', toolkit: 'Jira' })).toEqual({
      need: 'sign_in',
      toolkit: 'Jira',
      credential: undefined,
    });
  });

  it('parses the credential name from the text of an older run', () => {
    const text = 'Paused for approval: credential gh-main not found. Add it, then approve.';
    expect(getWaitingRunNeed({ kind: 'paused', text })).toEqual({
      need: 'credential',
      toolkit: undefined,
      credential: 'gh-main',
    });
  });

  it('finds a later "credential X not found." after an earlier word that starts the same', () => {
    const text = 'Credentials are missing. Credential foo not found.';
    expect(getWaitingRunNeed({ kind: 'paused', text })).toEqual({
      need: 'credential',
      toolkit: undefined,
      credential: 'foo',
    });
  });

  it('reads the credential in any letter case and over a line break', () => {
    expect(getWaitingRunNeed({ kind: 'paused', text: 'CREDENTIAL\n gh-main \nNOT FOUND.' })).toMatchObject({
      need: 'credential',
      credential: 'gh-main',
    });
  });

  it('returns no need when no credential name stands between the words', () => {
    expect(getWaitingRunNeed({ kind: 'paused', text: 'Credential not found.' })).toEqual({});
    expect(getWaitingRunNeed({ kind: 'paused', text: 'Credential foo not found' })).toEqual({});
  });

  it('reads the first word after "toolkit" as the toolkit name', () => {
    const text = 'Paused: credential gh-main not found. Fix toolkit "GitHub" in this project.';
    expect(getWaitingRunNeed({ kind: 'paused', text })).toMatchObject({ toolkit: 'GitHub' });
  });

  it('keeps every word of a quoted toolkit name', () => {
    const text = "Paused: credential gh-main not found. Fix toolkit 'Jira Cloud' in this project.";
    expect(getWaitingRunNeed({ kind: 'paused', text })).toMatchObject({ toolkit: 'Jira Cloud' });
  });

  it('reads an unquoted toolkit name up to the first space', () => {
    const text = 'Paused: credential gh-main not found. Fix toolkit GitHub in this project.';
    expect(getWaitingRunNeed({ kind: 'paused', text })).toMatchObject({ toolkit: 'GitHub' });
  });

  it('parses a long toolkit text in linear time', () => {
    const text = `credential gh not found. toolkit ${'"'.repeat(20000)}`;
    const started = Date.now();
    getWaitingRunNeed({ kind: 'paused', text });
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('parses long text without a hit in linear time', () => {
    const text = 'credential '.repeat(20000);
    const started = Date.now();
    expect(getWaitingRunNeed({ kind: 'paused', text })).toEqual({});
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('parses the toolkit of a sign-in pause from the text', () => {
    expect(getWaitingRunNeed({ kind: 'paused', text: 'Paused: a sign-in is needed for Jira.' })).toEqual({
      need: 'sign_in',
      toolkit: 'Jira',
    });
  });

  it('keeps the structured toolkit when the text names the credential only', () => {
    const text = 'Paused for approval: credential "gh-main" not found.';
    expect(getWaitingRunNeed({ kind: 'paused', toolkit: 'GitHub', text })).toMatchObject({
      need: 'credential',
      toolkit: 'GitHub',
      credential: 'gh-main',
    });
  });

  it('returns no need for another pause or no event', () => {
    expect(
      getWaitingRunNeed({ kind: 'paused', text: 'Paused: Teams · post_message needs approval' }),
    ).toEqual({});
    expect(getWaitingRunNeed(undefined)).toEqual({});
  });
});

describe('getWaitingRunNeed for the tools approval before the first call', () => {
  const tools = [
    { toolkit: 'github', tool: 'create_pull_request' },
    { toolkit: 'github', tool: 'delete_file' },
  ];

  it('returns the need and the tools that may still ask', () => {
    const mayAsk = [{ toolkit: 'jira', tool: 'create_issue' }];
    expect(getWaitingRunNeed({ kind: 'paused', need: 'tools', tools, may_ask: mayAsk })).toEqual({
      need: 'tools',
      mayAsk,
    });
  });

  it('returns empty lists when the event carries none', () => {
    expect(getWaitingRunNeed({ kind: 'paused', need: 'tools' })).toEqual({
      need: 'tools',
      mayAsk: [],
    });
  });
});

describe('getPausedTools', () => {
  it('returns the tools of a call-time pause that lists several', () => {
    const tools = [
      { toolkit: 'github', tool: 'create_issue' },
      { toolkit: 'github', tool: 'delete_issue' },
    ];
    expect(getPausedTools({ kind: 'paused', tools })).toEqual(tools);
  });

  it('returns an empty list for an older event, a bad value or no event', () => {
    expect(getPausedTools({ kind: 'paused', text: 'Paused' })).toEqual([]);
    expect(getPausedTools({ kind: 'paused', tools: 'github' })).toEqual([]);
    expect(getPausedTools({ kind: 'paused', tools: [null, { toolkit: 'x' }] })).toEqual([]);
    expect(getPausedTools(undefined)).toEqual([]);
  });
});

describe('getPausedMoreCount', () => {
  const labels = count => Array.from({ length: count }, (_, index) => `a · t${index}`).join(', ');
  const tools = count => Array.from({ length: count }, (_, index) => ({ toolkit: 'a', tool: `t${index}` }));

  it('counts the tools the list lacks, not the tools the text lacks', () => {
    // 70 tools: the text names 10 and counts 60; the list holds 50
    expect(getPausedMoreCount({ text: `Paused: ${labels(10)} (+60 more)`, tools: tools(50) })).toBe(20);
    expect(getPausedMoreCount({ text: `Paused: ${labels(10)} (+43 more) `, tools: tools(50) })).toBe(3);
  });

  it('returns 0 when the list holds every tool the text counts', () => {
    expect(getPausedMoreCount({ text: `Paused: ${labels(10)} (+20 more)`, tools: tools(30) })).toBe(0);
    expect(getPausedMoreCount({ text: `Paused: ${labels(8)} (+1 more)`, tools: tools(9) })).toBe(0);
  });

  it('returns 0 for a complete text, a count inside the text, a bad value or no event', () => {
    expect(getPausedMoreCount({ text: `Paused: ${labels(2)}`, tools: tools(2) })).toBe(0);
    expect(getPausedMoreCount({ text: 'Paused (+2 more) for approval: a · t0', tools: tools(1) })).toBe(0);
    expect(getPausedMoreCount({ text: 42 })).toBe(0);
    expect(getPausedMoreCount(undefined)).toBe(0);
  });
});

describe('formatTool', () => {
  it('joins the toolkit and the tool with a dot', () => {
    expect(formatTool({ toolkit: 'github', tool: 'delete_file' })).toBe('github · delete_file');
  });

  it('shows the tool alone when the toolkit is unknown', () => {
    expect(formatTool({ tool: 'delete_file' })).toBe('delete_file');
  });
});

describe('hasMissingCredential', () => {
  const result = {
    blocking: [{ code: 'missing_credential', toolkit: 'GitHub' }],
    warnings: [{ code: 'sensitive_action', toolkit: 'Jira' }],
  };

  it('is true for a missing_credential finding of the toolkit, in any case', () => {
    expect(hasMissingCredential(result, 'github')).toBe(true);
  });

  it('reads the findings under notices, where "Pause and ask me" puts them', () => {
    const notices = { blocking: [], notices: [{ code: 'missing_credential', toolkit: 'GitHub' }] };
    expect(hasMissingCredential(notices, 'GitHub')).toBe(true);
  });

  it('is false when only another toolkit misses a credential', () => {
    expect(hasMissingCredential(result, 'Jira')).toBe(false);
    expect(hasMissingCredential({ blocking: [] }, 'GitHub')).toBe(false);
  });
});

describe('findWaitingRun', () => {
  it('returns the first run that waits for approval', () => {
    const waiting = { id: 2, status: 'waiting_for_approval' };
    expect(findWaitingRun([{ id: 1, status: 'success' }, waiting])).toBe(waiting);
    expect(findWaitingRun(undefined)).toBeUndefined();
  });
});

describe('getRunDeciderId', () => {
  const schedule = { owner: { id: 5 } };

  it('returns decider_id of the run, also when an admin started it', () => {
    expect(getRunDeciderId({ trigger: 'manual', requested_by: 9, decider_id: 5 }, schedule)).toBe(5);
  });

  it('returns decider_id of a run whose schedule has a new owner', () => {
    expect(getRunDeciderId({ trigger: 'cron', decider_id: 3 }, schedule)).toBe(3);
  });

  it('returns decider_id of a Test run without a schedule', () => {
    expect(getRunDeciderId({ isDraftRun: true, requested_by: 9, decider_id: 9 }, undefined)).toBe(9);
  });

  it('falls back to the schedule owner, not the starter, for a schedule run without decider_id', () => {
    expect(getRunDeciderId({ trigger: 'manual', requested_by: 9 }, schedule)).toBe(5);
    expect(getRunDeciderId({ trigger: 'cron' }, schedule)).toBe(5);
  });

  it('falls back to the starter of a Test run without decider_id', () => {
    expect(getRunDeciderId({ isDraftRun: true, requested_by: 9 }, undefined)).toBe(9);
  });

  it('returns undefined for a run with neither a decider nor a schedule', () => {
    expect(getRunDeciderId({ id: 1 }, undefined)).toBeUndefined();
    expect(getRunDeciderId(undefined, undefined)).toBeUndefined();
  });
});

describe('isDeciderStarter', () => {
  it('is true for a Test run', () => {
    expect(isDeciderStarter({ isDraftRun: true, decider_id: 9 })).toBe(true);
  });

  it('is false for a schedule run with decider_id, whoever started it', () => {
    expect(isDeciderStarter({ trigger: 'manual', requested_by: 9, decider_id: 5 })).toBe(false);
  });

  it('is false for a manual run without decider_id', () => {
    expect(isDeciderStarter({ trigger: 'manual', requested_by: 9 })).toBe(false);
  });
});

describe('getRunNoteActions', () => {
  const all = ['pause', 'resume', 'change_owner', 'run'];

  it('lists Pause, Change owner and Run for an enabled schedule', () => {
    expect(getRunNoteActions({ enabled: true, allowed_actions: all })).toEqual([
      'pause',
      'change_owner',
      'run',
    ]);
  });

  it('lists Resume instead of Pause for a paused schedule', () => {
    expect(getRunNoteActions({ enabled: false, allowed_actions: all })).toEqual([
      'resume',
      'change_owner',
      'run',
    ]);
  });

  it('lists only what the server allows, and nothing for a member', () => {
    expect(getRunNoteActions({ enabled: true, allowed_actions: ['run'] })).toEqual(['run']);
    expect(getRunNoteActions({ enabled: true, allowed_actions: [] })).toEqual([]);
    expect(getRunNoteActions({ enabled: true })).toEqual([]);
  });
});

describe('describeRunNoteActions', () => {
  it('joins three actions with commas and "or"', () => {
    expect(describeRunNoteActions(['pause', 'change_owner', 'run'], 'schedule')).toBe(
      'You can pause the schedule, change its owner, or start a new run as yourself.',
    );
  });

  it('joins two actions with "or" and names the webhook', () => {
    expect(describeRunNoteActions(['pause', 'run'], 'webhook')).toBe(
      'You can pause the webhook or start a new run as yourself.',
    );
  });

  it('names one action alone and gives no text for none', () => {
    expect(describeRunNoteActions(['run'], 'schedule')).toBe('You can start a new run as yourself.');
    expect(describeRunNoteActions([], 'schedule')).toBe('');
  });
});
