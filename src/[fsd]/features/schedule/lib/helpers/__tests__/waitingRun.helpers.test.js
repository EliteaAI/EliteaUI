import { describe, expect, it } from 'vitest';

import {
  findWaitingRun,
  getRunActorId,
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

describe('getRunActorId', () => {
  const schedule = { owner: { id: 5 } };

  it.each(['manual', 'test'])('returns the starter of a %s run', trigger => {
    expect(getRunActorId({ trigger, requested_by: 9 }, schedule)).toBe(9);
  });

  it('returns the schedule owner for a cron run', () => {
    expect(getRunActorId({ trigger: 'cron', requested_by: 9 }, schedule)).toBe(5);
  });

  it('returns the schedule owner for a manual run without a starter', () => {
    expect(getRunActorId({ trigger: 'manual', requested_by: null }, schedule)).toBe(5);
  });

  it('returns undefined when the run has no starter to use and there is no schedule', () => {
    expect(getRunActorId({ trigger: 'cron' }, undefined)).toBeUndefined();
    expect(getRunActorId(undefined, undefined)).toBeUndefined();
  });
});
