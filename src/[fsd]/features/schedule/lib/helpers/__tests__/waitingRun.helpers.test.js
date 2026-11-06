import { describe, expect, it } from 'vitest';

import {
  findWaitingRun,
  formatTool,
  getPausedTools,
  getWaitingRunNeed,
  hasMissingCredential,
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

  it('returns the tools and the tools that may still ask', () => {
    const mayAsk = [{ toolkit: 'jira', tool: 'create_issue' }];
    expect(getWaitingRunNeed({ kind: 'paused', need: 'tools', tools, may_ask: mayAsk })).toEqual({
      need: 'tools',
      tools,
      mayAsk,
    });
  });

  it('returns empty lists when the event carries none', () => {
    expect(getWaitingRunNeed({ kind: 'paused', need: 'tools' })).toEqual({
      need: 'tools',
      tools: [],
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
